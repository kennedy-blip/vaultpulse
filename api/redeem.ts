import type{VercelRequest,VercelResponse}from"@vercel/node";import{vaultStore}from"./_store";
export default function handler(req:VercelRequest,res:VercelResponse){res.setHeader("Cache-Control","no-store");if(req.method!=="POST"){res.setHeader("Allow","POST");return res.status(405).json({error:"Method not allowed"});}
let body:any=req.body;if(typeof body==="string"){try{body=JSON.parse(body)}catch{return res.status(400).json({error:"Invalid JSON"})}}
const id=body?.secretId;if(typeof id!=="string"||id.length>100)return res.status(400).json({error:"A valid secretId is required."});
const v=vaultStore.get(id);if(!v)return res.status(410).json({error:"Secret expired, already redeemed, or unavailable."});if(v.expiresAt<=Date.now()){vaultStore.delete(id);return res.status(410).json({error:"Secret expired."});}
if(v.burnAfterRead)vaultStore.delete(id);return res.status(200).json({ciphertext:v.ciphertext,iv:v.iv,burnAfterRead:v.burnAfterRead,burned:v.burnAfterRead,expiresAt:v.expiresAt});}