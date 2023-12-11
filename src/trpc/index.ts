import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';
import { privateProcedure, publicProcedure, router } from './trpc';
import { TRPCError } from '@trpc/server';
import { db } from '@/db';
import z from 'zod';
import { INFINITE_QUERY_LIMIT } from '@/config/infinite-query';
import { absoluteUrl } from '@/lib/utils';
import { getUserSubscriptionPlan, stripe } from '@/lib/stripe';
import { PLANS } from '@/config/stripe';
import { PDFLoader } from 'langchain/document_loaders/fs/pdf';
import { pinecone } from '@/lib/pinecone';
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { PineconeStore } from 'langchain/vectorstores/pinecone';

export const appRouter = router({
  authCallback: publicProcedure.query(async () => {
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    if (!user?.id || !user?.email)
      throw new TRPCError({ code: 'UNAUTHORIZED' });

    // check if the user is in the database
    const dbUser = await db.user.findFirst({
      where: {
        id: user.id,
      },
    });

    if (!dbUser) {
      // create user in db
      await db.user.create({
        data: {
          id: user.id,
          email: user.email,
        },
      });
    }

    return { success: true };
  }),
  redirectToIDme: publicProcedure.query(async ({ ctx }) => {
    const clientId = process.env.IDME_CLIENT_ID;
    const redirectUri = absoluteUrl('/api/auth/idMeCallback');
    const scope = 'military'; // Define scope as per ID.me requirements
    // const state = encodeURIComponent(
    //   JSON.stringify({ origin: ctx.origin })
    // );

    const authUrl = `https://api.id.me/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}`;

    return { url: authUrl };
  }),
  getMilitaryUser: privateProcedure
    .input(z.object({ code: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const { code } = input;
      const clientId = process.env.NEXT_PUBLIC_IDME_CLIENT_ID;
      const clientSecret = process.env.NEXT_PUBLIC_IDME_CLIENT_SECRET;
      const redirectUri = 'https://localhost:3000/idMeCallback?origin=pricing'; // Replace with your callback URL

      // const state = encodeURIComponent(
      //   JSON.stringify({ originUrl: window.location.pathname })
      // );
      const tokenUrl = 'https://api.id.me/oauth/token';

      try {
        const tokenResponse = await fetch(tokenUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            grant_type: 'authorization_code',
            code: code,
            client_id: clientId,
            client_secret: clientSecret,
            redirect_uri: redirectUri,
          }),
        });

        const tokenData = await tokenResponse.json();
        if (!tokenResponse.ok) {
          throw new Error(
            tokenData.error || 'Failed to exchange code for token'
          );
        }

        // Use the access token to request user information
        const userInfoUrl = 'https://api.id.me/api/public/v3/attributes.json'; // Replace with the correct user info URL
        const userInfoResponse = await fetch(userInfoUrl, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${tokenData.access_token}`,
          },
        });

        const userInfo = await userInfoResponse.json();
        if (!userInfoResponse.ok) {
          throw new Error(
            userInfo.error || 'Failed to retrieve user information'
          );
        }

        // Extracting group and verified status
        const userStatus = userInfo.status[0];
        const group = userStatus.group;
        const verified = userStatus.verified;
        if (group !== 'military' || !verified) {
          throw new Error('User is not a verified military member');
        }

        console.log('User is a verified military member');
        return userInfo;
      } catch (error) {
        console.error('Error:', error);
        throw error;
      }
    }),
  getUserFiles: privateProcedure.query(async ({ ctx }) => {
    const { userId, user } = ctx;

    return await db.file.findMany({
      where: {
        userId: userId,
      },
    });
  }),

  deleteFile: privateProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { userId } = ctx;
      const file = await db.file.findFirst({
        where: {
          id: input.id,
          userId: userId,
        },
      });

      if (!file) throw new TRPCError({ code: 'NOT_FOUND' });

      await db.file.delete({
        where: {
          id: input.id,
        },
      });

      return file;
    }),
  getFile: privateProcedure
    .input(z.object({ downloadURL: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { userId } = ctx;
      const file = await db.file.findFirst({
        where: {
          key: input.downloadURL,
          userId,
        },
      });

      if (!file) throw new TRPCError({ code: 'NOT_FOUND' });

      return file;
    }),

  getCreateFile: privateProcedure
    .input(
      z.object({
        downloadURL: z.string(),
        fileName: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { userId } = ctx;
      const subscriptionPlan = await getUserSubscriptionPlan();
      const doesFileExist = await db.file.findFirst({
        where: {
          key: input.downloadURL,
        },
      });

      if (doesFileExist) return;

      const createdFile = await db.file.create({
        data: {
          key: input.downloadURL,
          name: input.fileName,
          userId: userId,
          url: input.downloadURL,
          uploadStatus: 'PROCESSING',
        },
      });

      if (!createdFile) throw new TRPCError({ code: 'NOT_FOUND' });

      try {
        const response = await fetch(input.downloadURL);
        const blob = await response.blob();

        const loader = new PDFLoader(blob);

        const pageLevelDocs = await loader.load();

        const taggedPageLevelDocs = pageLevelDocs.map((doc) => {
          return {
            ...doc,
            metadata: {
              userId: userId,
              fileId: createdFile.id,
            }, // Attaching user ID as metadata
          };
        });

        const pagesAmount = pageLevelDocs.length;
        const { isSubscribed } = subscriptionPlan;

        const isProExceeded =
          pagesAmount > PLANS.find((plan) => plan.name === 'Pro')!.pagesPerPdf;
        const isFreeExceeded =
          pagesAmount > PLANS.find((plan) => plan.name === 'Free')!.pagesPerPdf;
        const isMilitaryExceeded =
          pagesAmount >
          PLANS.find((plan) => plan.name === 'Military')!.pagesPerPdf;

        if (
          (isSubscribed && isProExceeded) ||
          (isSubscribed && isMilitaryExceeded) ||
          (!isSubscribed && isFreeExceeded)
        ) {
          await db.file.update({
            data: {
              uploadStatus: 'FAILED',
            },
            where: {
              id: createdFile.id,
            },
          });
          return;
        }

        const pineconeIndex = pinecone.Index('summar');

        const embeddings = new OpenAIEmbeddings({
          openAIApiKey: process.env.OPENAI_API_KEY!,
        });

        await PineconeStore.fromDocuments(taggedPageLevelDocs, embeddings, {
          pineconeIndex,
        });

        await db.file.update({
          where: { id: createdFile.id },
          data: {
            uploadStatus: 'SUCCESS',
          },
        });
      } catch (err) {
        await db.file.update({
          where: { id: createdFile.id },
          data: {
            uploadStatus: 'FAILED',
          },
        });
      }

      return createdFile;
    }),

  getFileUploadStatus: privateProcedure
    .input(z.object({ fileId: z.string() }))
    .query(async ({ input, ctx }) => {
      const file = await db.file.findFirst({
        where: {
          id: input.fileId,
          userId: ctx.userId,
        },
      });

      if (!file) return { status: 'PENDING' as const };

      return { status: file.uploadStatus };
    }),

  getFileMessages: privateProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).nullish(),
        cursor: z.string().nullish(),
        fileId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { userId } = ctx;
      const { fileId, cursor } = input;
      const limit = input.limit ?? INFINITE_QUERY_LIMIT;

      const file = await db.file.findFirst({
        where: {
          id: fileId,
          userId,
        },
      });

      if (!file) throw new TRPCError({ code: 'NOT_FOUND' });

      const messages = await db.message.findMany({
        take: limit + 1,
        where: {
          fileId,
        },
        orderBy: {
          createdAt: 'desc',
        },
        cursor: cursor ? { id: cursor } : undefined,
        select: {
          id: true,
          isUserMessage: true,
          createdAt: true,
          text: true,
        },
      });
      let nextCursor: typeof cursor | undefined = undefined;
      if (messages.length > limit) {
        const nextItem = messages.pop();
        nextCursor = nextItem?.id;
      }

      return {
        messages,
        nextCursor,
      };
    }),

  createStripeSession: privateProcedure.mutation(async ({ ctx }) => {
    const { userId } = ctx;

    const billingUrl = absoluteUrl('/dashboard/billing');

    if (!userId) throw new TRPCError({ code: 'UNAUTHORIZED' });

    const dbUser = await db.user.findFirst({
      where: {
        id: userId,
      },
    });

    if (!dbUser) throw new TRPCError({ code: 'UNAUTHORIZED' });

    const subscriptionPlan = await getUserSubscriptionPlan();

    if (subscriptionPlan.isSubscribed && dbUser.stripeCustomerId) {
      const stripeSession = await stripe.billingPortal.sessions.create({
        customer: dbUser.stripeCustomerId,
        return_url: billingUrl,
      });
      return { url: stripeSession.url };
    }

    const stripeSession = await stripe.checkout.sessions.create({
      success_url: billingUrl,
      cancel_url: billingUrl,
      payment_method_types: ['card'],
      mode: 'subscription',
      billing_address_collection: 'auto',
      line_items: [
        {
          price: PLANS.find((plan) => plan.name === 'Pro')?.price.priceIds.test,
          quantity: 1,
        },
      ],

      metadata: {
        userId: userId,
      },
    });
    return { url: stripeSession.url };
  }),

  createMilitaryStripeSession: privateProcedure.mutation(async ({ ctx }) => {
    const { userId } = ctx;
    const billingUrl = absoluteUrl('/dashboard/billing');
    const militaryPriceId = PLANS.find((plan) => plan.name === 'Military')
      ?.price.priceIds.test;
    if (!userId) throw new TRPCError({ code: 'UNAUTHORIZED' });
    const dbUser = await db.user.findFirst({
      where: {
        id: userId,
      },
    });

    if (!dbUser) throw new TRPCError({ code: 'UNAUTHORIZED' });

    const subscriptionPlan = await getUserSubscriptionPlan();

    if (
      subscriptionPlan.isSubscribed &&
      dbUser.stripeCustomerId &&
      dbUser.stripePriceId === militaryPriceId
    ) {
      const stripeSession = await stripe.billingPortal.sessions.create({
        customer: dbUser.stripeCustomerId,
        return_url: billingUrl,
      });

      return { url: stripeSession.url };
    }
    const stripeSession = await stripe.checkout.sessions.create({
      success_url: billingUrl,
      cancel_url: billingUrl,
      payment_method_types: ['card'],
      mode: 'subscription',
      billing_address_collection: 'auto',
      line_items: [
        {
          price: PLANS.find((plan) => plan.name === 'Military')?.price.priceIds
            .test,
          quantity: 1,
        },
      ],
      subscription_data: {
        trial_period_days: 725,
      },
      payment_method_collection: 'if_required',
      metadata: {
        userId: userId,
      },
    });

    return { url: stripeSession.url };
  }),
});

export type AppRouter = typeof appRouter;
