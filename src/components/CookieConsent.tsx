'use client';
import React, { useEffect, useState } from 'react';
import cookie from 'js-cookie';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { motion } from 'framer-motion';

const CookieConsentBanner = () => {
  const [showBanner, setShowBanner] = useState<boolean>(false);
  const [functionalCookies, setFunctionalCookies] = useState<boolean>(false);
  const [performanceCookies, setPerformanceCookies] = useState<boolean>(false);
  const [animateBanner, setAnimateBanner] = useState("visible");

  useEffect(() => {
    cookie.remove('cookieConsent');
    const consentCookie = cookie.get('cookieConsent');
    if (consentCookie) {
      const preferences = JSON.parse(consentCookie);
      setFunctionalCookies(preferences.functional);
      setPerformanceCookies(preferences.performance);
      setShowBanner(false);
    } else {
      setShowBanner(true);
    }
  }, []);

  const handleToggle = (type: string, value: boolean) => {
    if (type === 'functional') {
      setFunctionalCookies(value);
    } else if (type === 'performance') {
      setPerformanceCookies(value);
    }
  };

  const handleSavePreferences = () => {
    const preferences = {
      functional: functionalCookies,
      performance: performanceCookies,
    };
    cookie.set('cookieConsent', JSON.stringify(preferences), { expires: 7 });

    setAnimateBanner("exit");
  };

  if (!showBanner) {
    return null;
  }

  const variants = {
    hidden: { y: '100%', opacity: 0 },
    visible: { y: 0, opacity: 1 },
    exit: { y: '100%', opacity: 1 } // Added exit variant
  };

  return (
    <motion.div
    initial="hidden"
    animate={animateBanner}
    exit="exit"
    variants={variants}
    transition={{ delay: 1, duration: 0.5 }}
    onAnimationComplete={() => {
      if (animateBanner === "exit") {
        setShowBanner(false);
      }
    }}
      className='fixed bottom-0 left-0 z-50 max-w-[400px]'
    >
      <Card>
        <CardHeader>
          <CardTitle>Cookie Settings</CardTitle>
          <CardDescription>Manage your cookie settings here.</CardDescription>
        </CardHeader>
        <CardContent className='grid gap-6'>
          <div className='flex items-center justify-between space-x-2'>
            <Label htmlFor='necessary' className='flex flex-col space-y-1'>
              <span>Strictly Necessary</span>
              <span className='font-normal leading-snug text-muted-foreground'>
                These cookies are essential in order to use the website and use
                its features.
              </span>
            </Label>
            <Switch id='necessary' defaultChecked />
          </div>
          <div className='flex items-center justify-between space-x-2'>
            <Label htmlFor='functional' className='flex flex-col space-y-1'>
              <span>Functional Cookies</span>
              <span className='font-normal leading-snug text-muted-foreground'>
                These cookies allow the website to provide personalized
                functionality.
              </span>
            </Label>
            <Switch
              id='functional'
              checked={functionalCookies}
              onCheckedChange={(checked) => handleToggle('functional', checked)}
            />
          </div>
          <div className='flex items-center justify-between space-x-2'>
            <Label htmlFor='performance' className='flex flex-col space-y-1'>
              <span>Performance Cookies</span>
              <span className='font-normal leading-snug text-muted-foreground'>
                These cookies help to improve the performance of the website.
              </span>
            </Label>
            <Switch
              id='performance'
              checked={performanceCookies}
              onCheckedChange={(checked) =>
                handleToggle('performance', checked)
              }
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button
            variant='outline'
            className='w-full'
            onClick={handleSavePreferences}
          >
            Save preferences
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
};

export default CookieConsentBanner;
