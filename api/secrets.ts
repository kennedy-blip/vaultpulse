import type{VercelRequest,VercelResponse}from"@vercel/node";import{randomUUID}from"node:crypto";import{pruneExpired,vaultStore,type VaultRecord}from"./_store";
export default function handler(req:VercelRequest,res:VercelResponse){res.setHeader("Cache-Control","no-store");
if(req.method==="GET"){pruneExpired();const vaults=[...vaultStore.values()].sort((a,b)=>b.createdAt-a.createdAt).map(({secretId,burnAfterRead,createdAt,expiresAt})=>({secretId,burnAfterRead,createdAt,expiresAt,status:"active"}));return res.status(200).json({vaults,count:vaults.length,storage:"ephemeral-memory"});}
if(req.method!=="POST"){res.setHeader("Allow","GET, POST");return res.status(405).json({error:"Method not allowed"});}
let body:any=req.body;if(typeof body==="string"){try{body=JSON.parse(body)}catch{return res.status(400).json({error:"Invalid JSON"})}}
const{ciphertext,iv,burnAfterRead=false}=body??{};const ttlSeconds=Number(body?.ttlSeconds??3600);
if(typeof ciphertext!=="string"||ciphertext.length<16||ciphertext.length>1500000||typeof iv!=="string"||iv.length<8||iv.length>128)return res.status(400).json({error:"Valid ciphertext and IV are required."});
if(!Number.isInteger(ttlSeconds)||ttlSeconds<60||ttlSeconds>604800)return res.status(400).json({error:"TTL must be 60 seconds to 7 days."});
pruneExpired();const secretId=randomUUID(),now=Date.now();const record:VaultRecord={secretId,ciphertext,iv,burnAfterRead:burnAfterRead===true,createdAt:now,expiresAt:now+ttlSeconds*1000};vaultStore.set(secretId,record);
return res.status(201).json({secretId,expiresAt:record.expiresAt});}