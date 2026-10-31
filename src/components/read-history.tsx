'use client';
import { useEffect } from 'react';
export function ReadHistory({ id }: { id: number }) {
  useEffect(() => {
    try {
      const value: unknown = JSON.parse(localStorage.getItem('pratirodh:recent') || '[]');
      const previous = Array.isArray(value) ? value.filter(item => Number.isInteger(item) && item > 0 && item !== id) : [];
      localStorage.setItem('pratirodh:recent', JSON.stringify([id, ...previous].slice(0, 30)));
    } catch { /* Reading is available without device storage. */ }
  }, [id]);
  return null;
}
