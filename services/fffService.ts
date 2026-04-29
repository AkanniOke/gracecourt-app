import { fffCentres, type FffCentre } from '@/data/fffCentres';

const FFF_DELAY_MS = 400;

export function getFFFcentres(): Promise<FffCentre[]> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(fffCentres), FFF_DELAY_MS);
  });
}
