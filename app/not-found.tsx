"use client";

import Link from 'next/link'
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button'

export default function NotFound() {
  const t = useTranslations('notFound');
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8 text-center">
        <div className="mb-6">
          <h1 className="text-6xl font-bold text-gray-900 mb-2">{t('title')}</h1>
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">{t('heading')}</h2>
          <p className="text-gray-600 mb-8">
            {t('message')}
          </p>
        </div>
        
        <div className="space-y-4">
          <Button asChild className="w-full">
            <Link href="/">
              {t('backHome')}
            </Link>
          </Button>
          
          <Button variant="outline" asChild className="w-full">
            <Link href="/home">
              {t('goToDashboard')}
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

