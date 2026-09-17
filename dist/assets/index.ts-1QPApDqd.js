import{g as x,a as S}from"./storage-em6M6mg-.js";chrome.runtime.onMessage.addListener((e,t,n)=>{if(e.type==="inboxsdk__injectPageWorld"&&t.tab)if(chrome.scripting){let a,s;t.documentId?a=[t.documentId]:s=[t.frameId],chrome.scripting.executeScript({target:{tabId:t.tab.id,documentIds:a,frameIds:s},world:"MAIN",files:["pageWorld.js"]}),n(!0)}else n(!1)});const b="https://generativelanguage.googleapis.com/v1beta/models";async function g(e,t,n,a,s=!1){var d,p,h,m,f,y;const r=`${b}/${t}:generateContent?key=${e}`,o={system_instruction:{parts:[{text:a}]},contents:[{role:"user",parts:[{text:n}]}],generationConfig:{temperature:.7,topP:.95,...s&&{responseMimeType:"application/json"}}},i=await fetch(r,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(o)});if(!i.ok){const w=await i.text();let c=`Gemini API error (${i.status})`;try{const l=JSON.parse(w);c=((d=l==null?void 0:l.error)==null?void 0:d.message)||c}catch{}throw new Error(c)}const u=await i.json();if(!((y=(f=(m=(h=(p=u.candidates)==null?void 0:p[0])==null?void 0:h.content)==null?void 0:m.parts)==null?void 0:f[0])!=null&&y.text))throw new Error("Empty response from Gemini API");return u.candidates[0].content.parts[0].text}const T=`You are an expert email assistant. Your job is to analyze an email thread and identify 2-3 essential clarifying questions that would help write a complete, thoughtful, and appropriate reply.

Rules:
- Generate exactly 2 to 3 questions
- Questions should cover: intent/tone, key details to confirm, and any decisions to be made
- Keep questions concise and specific to the email content
- Return ONLY a JSON array of question strings, nothing else

Example output: ["What tone should the reply have — formal or casual?", "Should I confirm attending the meeting on Thursday?", "Do you want to address the budget concern they raised?"]`;async function E(e,t,n){const a=`Here is the email thread I need to reply to:

---
${n}
---

Generate 2-3 clarifying questions to help me write the best reply.`,s=await g(e,t,a,T,!0);try{const r=JSON.parse(s);if(Array.isArray(r)&&r.every(o=>typeof o=="string"))return r;if(r.questions&&Array.isArray(r.questions))return r.questions;throw new Error("Unexpected response format")}catch(r){const o=s.match(/\[[\s\S]*\]/);if(o)return JSON.parse(o[0]);throw new Error(`Failed to parse questions: ${r}`)}}const A=`You are an expert email writer. Given an email thread and the user's answers to clarifying questions, write a professional and natural email reply.

Rules:
- Write ONLY the email body text
- Match the tone indicated by the user's answers
- Be concise but thorough
- Do NOT include email headers (To, From, Subject, Date)
- Do NOT include an email signature
- Use proper paragraph spacing
- The reply should feel human-written, not robotic`;async function I(e,t,n,a){const s=a.map((o,i)=>`Q${i+1}: ${o.question}
A${i+1}: ${o.answer}`).join(`

`),r=`Original email thread:

---
${n}
---

My answers to the clarifying questions:

${s}

Please write the reply email based on the thread and my answers above.`;return g(e,t,r,A,!1)}chrome.runtime.onMessage.addListener((e,t,n)=>(q(e).then(n).catch(a=>n({success:!1,error:String((a==null?void 0:a.message)||a)})),!0));async function q(e){const t=await x();if(!t)return{success:!1,error:"Gemini API key not configured. Please set it in the extension Options page."};const n=await S();switch(e.action){case"GENERATE_QUESTIONS":return{success:!0,questions:await E(t,n,e.emailContext)};case"GENERATE_DRAFT":return{success:!0,draft:await I(t,n,e.emailContext,e.answers)};default:return{success:!1,error:"Unknown action"}}}chrome.runtime.onInstalled.addListener(e=>{e.reason==="install"&&(chrome.action.setBadgeText({text:"!"}),chrome.action.setBadgeBackgroundColor({color:"#ef4444"}))});
