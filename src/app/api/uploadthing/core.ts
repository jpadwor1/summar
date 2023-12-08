import { createUploadthing, type FileRouter } from 'uploadthing/next';
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';
import { db } from '@/db';
import { PDFLoader } from 'langchain/document_loaders/fs/pdf';
import { pinecone } from '@/lib/pinecone';
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { PineconeStore } from 'langchain/vectorstores/pinecone';
import { getUserSubscriptionPlan } from '@/lib/stripe';
import { PLANS } from '@/config/stripe';

const f = createUploadthing();

const middleware = async () => {
  const { getUser } = getKindeServerSession();
  const user = await getUser();

  if (!user || !user.id) throw new Error('Unauthorized');

  const subscriptionPlan = await getUserSubscriptionPlan();

  return { subscriptionPlan, userId: user.id };
};

const onUploadComplete = async ({
  metadata,
  file,
}: {
  metadata: Awaited<ReturnType<typeof middleware>>;
  file: { key: string; name: string; url: string };
}) => {
  const doesFileExist = await db.file.findFirst({
    where: {
      key: file.key,
    },
  });

  if (doesFileExist) return;

  const createdFile = await db.file.create({
    data: {
      key: file.key,
      name: file.name,
      userId: metadata.userId,
      url: `https://uploadthing-prod.s3.us-west-2.amazonaws.com/${file.key}`,
      uploadStatus: 'PROCESSING',
    },
  });

  try {
    const response = await fetch(
      `https://uploadthing-prod.s3.us-west-2.amazonaws.com/${file.key}`
    );
    const blob = await response.blob();

    const loader = new PDFLoader(blob);

    const pageLevelDocs = await loader.load();

    const taggedPageLevelDocs = pageLevelDocs.map((doc) => {
      return {
        ...doc,
        metadata: {
          userId: metadata.userId,
          fileId: createdFile.id,
        }, // Attaching user ID as metadata
      };
    });

    const pagesAmount = pageLevelDocs.length;
    const { subscriptionPlan } = metadata;
    const { isSubscribed } = subscriptionPlan;

    const isProExceeded =
      pagesAmount > PLANS.find((plan) => plan.name === 'Pro')!.pagesPerPdf;
    const isFreeExceeded =
      pagesAmount > PLANS.find((plan) => plan.name === 'Free')!.pagesPerPdf;
    const isMilitaryExceeded =
      pagesAmount > PLANS.find((plan) => plan.name === 'Military')!.pagesPerPdf;

    if ((isSubscribed && isProExceeded) || (isSubscribed && isMilitaryExceeded) || (!isSubscribed && isFreeExceeded)) {
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
};
export const ourFileRouter = {
  freePlanUploader: f({ pdf: { maxFileSize: '4MB' } })
    .middleware(middleware)
    .onUploadComplete(onUploadComplete),
  proPlanUploader: f({ pdf: { maxFileSize: '16MB' } })
    .middleware(middleware)
    .onUploadComplete(onUploadComplete),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
