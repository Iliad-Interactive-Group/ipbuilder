
'use client';
import { useState, useEffect } from 'react';
import { collection, onSnapshot, DocumentData, QueryDocumentSnapshot, query, where, orderBy } from 'firebase/firestore';
import { db } from './firebase';
import { Asset, Company, Market, Site, Station, AnyEquipment, AnySecret, ChangeEvent } from '@/lib/types';

const useFirestoreCollection = <T extends Asset | AnySecret | ChangeEvent>(collectionName: string, useStatus: boolean = true, sortField?: string): [T[], boolean, string | null] => {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    
    const collRef = collection(db, collectionName);
    let q;
    if (sortField) {
      q = query(collRef, orderBy(sortField, 'desc'));
    } else {
      q = useStatus ? query(collRef, where('status', '==', 'Active')) : query(collRef);
    }
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const collectionData: T[] = [];
      querySnapshot.forEach((doc: QueryDocumentSnapshot) => {
        collectionData.push({ id: doc.id, ...doc.data() } as T);
      });
      
      setData(collectionData);
      setLoading(false);
    }, (err) => {
      console.error(`[useFirestoreCollection] Error fetching collection '${collectionName}':`, err);
      setError(`Failed to load data: ${err.message}. Check Firestore security rules and if the collection exists.`);
      setData([]);
      setLoading(false);
    });

    return () => unsubscribe();
    
  }, [collectionName, useStatus, sortField]);

  return [data, loading, error];
};

export const useCompanies = () => useFirestoreCollection<Company>('companies');
export const useMarkets = () => useFirestoreCollection<Market>('markets');
export const useSites = () => useFirestoreCollection<Site>('sites');
export const useStations = () => useFirestoreCollection<Station>('stations');
export const useEquipment = () => useFirestoreCollection<AnyEquipment>('equipment');
export const useSecrets = () => useFirestoreCollection<AnySecret>('secrets', false);
export const useChangelog = () => useFirestoreCollection<ChangeEvent>('changelog', false, 'timestamp');


export function useAllAssets(): [Asset[], boolean, string | null] {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [companies, companiesLoading, companiesError] = useCompanies();
  const [markets, marketsLoading, marketsError] = useMarkets();
  const [sites, sitesLoading, sitesError] = useSites();
  const [stations, stationsLoading, stationsError] = useStations();
  const [equipment, equipmentLoading, equipmentError] = useEquipment();

  useEffect(() => {
    const anyLoading = companiesLoading || marketsLoading || sitesLoading || stationsLoading || equipmentLoading;
    setLoading(anyLoading);
  }, [companiesLoading, marketsLoading, sitesLoading, stationsLoading, equipmentLoading]);

  useEffect(() => {
    const anyError = companiesError || marketsError || sitesError || stationsError || equipmentError;
    setError(anyError);
  }, [companiesError, marketsError, sitesError, stationsError, equipmentError]);

  useEffect(() => {
    if (!loading && !error) {
      setAssets([
        ...companies,
        ...markets,
        ...sites,
        ...stations,
        ...equipment,
      ]);
    }
  }, [loading, error, companies, markets, sites, stations, equipment]);

  return [assets, loading, error];
}

    