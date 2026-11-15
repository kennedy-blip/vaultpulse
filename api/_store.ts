export type VaultRecord={secretId:string;ciphertext:string;iv:string;burnAfterRead:boolean;createdAt:number;expiresAt:number};
type Store=Map<string,VaultRecord>;
const root=globalThis as typeof globalThis&{__vaultPulseStore?:Store};
export const vaultStore:Store=root.__vaultPulseStore??new Map<string,VaultRecord>();root.__vaultPulseStore=vaultStore;
export function pruneExpired(now=Date.now()){for(const[id,v]of vaultStore)if(v.expiresAt<=now)vaultStore.delete(id);}