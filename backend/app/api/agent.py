"""
Agent API routes - Connects dashboard chat to Claude with trading tools
"""
from typing import Annotated, List, Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import httpx
import anthropic
import json
import os
import logging

from app.core.database import get_db
from app.api.auth import get_current_user
from app.models import Client, AgentChat, ChatRole

logger = logging.getLogger(__name__)

router = APIRouter()

# Hummingbot API URL
HUMMINGBOT_URL = os.getenv("HUMMINGBOT_API_URL", "http://localhost:8000")
ANTHROPIC_KEY = os.getenv("ANTHROPIC_API_KEY", "")

# =============================================================================
# TRADING TOOLS FOR CLAUDE
# =============================================================================

TRADING_TOOLS = [
        {
                    "name": "get_portfolio",
                    "description": "Get token balances for an account. Use when user asks to check balances.",
                    "input_schema": {
                                    "type": "object",
                                    "properties": {
                                                        "account_name": {"type": "string", "description": "Account name (default: master_account)"}
                                    },
                                    "required": []
                    }
        },
        {
                    "name": "get_prices",
                    "description": "Get current price for a trading pair. Use when user asks for token price.",
                    "input_schema": {
                                    "type": "object", 
                                    "properties": {
                                                        "connector_name": {"type": "string", "description": "Exchange (e.g. bitmart)"},
                                                        "trading_pairs": {"type": "array", "items": {"type": "string"}, "description": "Pairs like SHARP-USDT"}
                                    },
                                    "required": ["connector_name", "trading_pairs"]
                    }
        },
        {
                    "name": "place_order",
                    "description": "Place a buy or sell order.",
                    "input_schema": {
                                    "type": "object",
                                    "properties": {
                                                        "connector_name": {"type": "string"},
                                                        "trading_pair": {"type": "string"},
                                                        "side": {"type": "string", "enum": ["BUY", "SELL"]},
                                                        "amount": {"type": "string"},
                                                        "order_type": {"type": "string", "enum": ["MARKET", "LIMIT"]},
                                                        "price": {"type": "string"}
                                    },
                                    "required": ["connector_name", "trading_pair", "side", "amount"]
                    }
        },
        {
                    "name": "get_active_orders",
                    "description": "Get open orders.",
                    "input_schema": {
                                    "type": "object",
                                    "properties": {},
                                    "required": []
                    }
        }
]

SYSTEM_PROMPT = """You are a trading assistant for Pipe Labs. You help users check prices, balances, and execute trades.

Available commands:
- "check [TOKEN]" or "balance" - Show portfolio
- "[TOKEN] price" or "price of [TOKEN]" - Get current price  
- "buy/sell [AMOUNT] [TOKEN]" - Place order
- "show orders" - List open orders

When user asks about SHARP price, use get_prices with connector_name="bitmart" and trading_pairs=["SHARP-USDT"].
Be concise. Format prices clearly."""


# =============================================================================
# HUMMINGBOT API CALLS
# =============================================================================

async def call_hummingbot(method: str, endpoint: str, payload: dict = None) -> dict:
        """Call Hummingbot API"""
        async with httpx.AsyncClient(timeout=30.0) as client:
                    try:
                                    url = f"{HUMMINGBOT_URL}{endpoint}"
                                    if method == "GET":
                                                        resp = await client.get(url)
                    else:
                                        resp = await client.post(url, json=payload or {})
                                    resp.raise_for_status()
                        return resp.json()
except Exception as e:
            logger.error(f"Hummingbot API error: {e}")
            return {"error": str(e)}


async def execute_tool(tool_name: str, tool_input: dict) -> str:
        """Execute a tool and return result"""
        try:
                    if tool_name == "get_portfolio":
                                    result = await call_hummingbot("POST", "/portfolio/state", {
                                                        "account_names": [tool_input.get("account_name", "master_account")]
                                    })
elif tool_name == "get_prices":
            result = await call_hummingbot("POST", "/market-data/prices", {
                                "connector_name": tool_input["connector_name"],
                                "trading_pairs": tool_input["trading_pairs"]
            })
elif tool_name == "place_order":
            result = await call_hummingbot("POST", "/trading/orders", {
                                "connector_name": tool_input["connector_name"],
                                "trading_pair": tool_input["trading_pair"],
                                "trade_type": tool_input["side"],
                                "amount": tool_input["amount"],
                                "order_type": tool_input.get("order_type", "MARKET"),
                                "price": tool_input.get("price"),
                                "account_name": "master_account"
            })
elif tool_name == "get_active_orders":
            result = await call_hummingbot("POST", "/trading/orders/active", {})
else:
            result = {"error": f"Unknown tool: {tool_name}"}

        return json.dumps(result, default=str)
except Exception as e:
        return json.dumps({"error": str(e)})


# =============================================================================
# SCHEMAS
# =============================================================================

class ChatMessage(BaseModel):
        message: str

class ChatResponse(BaseModel):
        response: str
        actions_taken: List[dict] = []


# =============================================================================
# ENDPOINTS
# =============================================================================

@router.post("/chat", response_model=ChatResponse)
async def chat(
        request: ChatMessage,
        db: Annotated[AsyncSession, Depends(get_db)]
):
        """Send message to AI agent with trading tools"""
        try:
                    if not ANTHROPIC_KEY:
                                    return ChatResponse(
                                                        response="API key not configured. Please add ANTHROPIC_API_KEY to environment.",
                                                        actions_taken=[]
                                    )

                    claude = anthropic.Anthropic(api_key=ANTHROPIC_KEY)
                    messages = [{"role": "user", "content": request.message}]
                    actions_taken = []

        # Call Claude with tools
            response = claude.messages.create(
                            model="claude-sonnet-4-20250514",
                            "m"a"x
                _Atgoeknetn sA=P4I0 9r6o,u
                t e s   -   C o n n e c tssy sdtaesmh=bSoYaSrTdE Mc_hPaRtO MtPoT ,C
                l a u d e   w i t h   t rtaodoilnsg= TtRoAoDlIsN
                G"_"T"O
                OfLrSo,m
                  t y p i n g   i m p o rmte sAsnangoetsa=tmeeds,s aLgiesst
                  ,   O p t i o n a)l

                   f r o m   f a s
                   t a p i   i m p o#r tH aAnPdIlReo uttoeorl,  uDseep elnodosp,
                     H T T P E x c ewphtiiloen 
                     rfersopmo npsyed.asnttoipc_ riemapsoornt  =B=a s"etMooodle_lu
                     sfer"o:m
                       s q l a l c h e m y . etxoto.la_suysnecsi o=  i[mbp ofrotr  Abs yinnc Sreessspioonns
                       ef.rcoomn tseqnlta licfh ebm.yt yipmep o=r=t  "steoloelc_tu
                       siem"p]o
                       r t   h t t p x 
                        i m p omrets saangtehsr.oappipce
                        nidm(p{o"rrto ljes"o:n 
                        "iamspsoirstt aonst
                        "i,m p"ocrotn tleongtg"i:n gr
                        e
                        sfproonms ea.pcpo.nctoernet.}d)a
                        t a b a s e   i m p o r t
                          g e t _ d b 
                           f r o m  taopopl._arpeis.ualuttsh  =i m[p]o
                           r t   g e t _ c u r r e nfto_ru steoro
                           lf rionm  taopopl._muosdeesl:s
                             i m p o r t   C l i e n t ,   AlgoegngteCrh.aitn,f oC(hfa"tERxoelceu
                             t
                             ilnogg:g e{rt o=o ll.ongagmien}g .wgietthL o{gtgoeorl(._i_nnpaumte}_"_))


                               r o u t e r   =   A P I R o urteesru(l)t

                                =#  aHwuamimti negxbeoctu tAeP_It oUoRlL(
                                tHoUoMlM.InNaGmBeO,T _tUoRoLl .=i nopsu.tg)e
                                t e n v ( " H U M M I N G B O T _aAcPtIi_oUnRsL_"t,a k"ehnt.tapp:p/e/nldo(c{a
                                l h o s t : 8 0 0 0 " ) 
                                 A N T H R O P I"Ct_oKoElY" :=  tooso.lg.entaemnev,(
                                 " A N T H R O P I C _ A P I _ K E Y " ,  ""i"n)p
                                 u
                                 t#" := =t=o=o=l=.=i=n=p=u=t=,=
                                 = = = = = = = = = = = = = = = = = = = = ="=r=e=s=u=l=t="=:= =j=s=o=n=.=l=o=a=d=s=(=r=e=s=u=l=t=)=
                                 = = = = = = = = = = = = = = = 
                                  #} )T
                                  R A D I N G   T O O L S   F O R  tCoLoAlU_DrEe
                                  s#u l=t=s=.=a=p=p=e=n=d=(={=
                                  = = = = = = = = = = = = = = = = = = = = ="=t=y=p=e="=:= ="=t=o=o=l=_=r=e=s=u=l=t="=,=
                                  = = = = = = = = = = = = = = = = = = = = ="=t
                                  o
                                  oTlR_AuDsIeN_Gi_dT"O:O LtSo o=l .[i
                                  d , 
                                      { 
                                                       " n a m e " :   ""gceotn_tpeonrtt"f:o lrieos"u,l
                                                       t 
                                                                     " d e s c r i p t i}o)n
                                                                     " :   " G e t   t o k e n
                                                                       b a l a n c e s   f o rm easns aagcecso.uanptp.e nUds(e{ "wrhoelne "u:s e"ru saesrk"s,  t"oc ocnhteecnkt "b:a ltaonocle_sr.e"s,u
                                                                       l t s } ) 
                                                                             " i n p u t _ s c h
                                                                             e m a " :   { 
                                                                                       r e s p o n s e" t=y pcel"a:u d"eo.bmjeescsta"g,e
                                                                                       s . c r e a t e ( 
                                                                                             " p r o p e r t i e s " :  m{o
                                                                                             d e l = " c l a u d e - s o n n e"ta-c4c-o2u0n2t5_0n5a1m4e"",:
                                                                                               { " t y p e " :   " s t r i n gm"a,x _"tdoeksecnrsi=p4t0i9o6n,"
                                                                                               :   " A c c o u n t   n a m e   (sdyesftaeuml=tS:Y SmTaEsMt_ePrR_OaMcPcTo,u
                                                                                               n t ) " } 
                                                                                                                     t o}o,l
                                                                                                                     s = T R A D I N G _ T O O"LrSe,q
                                                                                                                     u i r e d " :   [ ] 
                                                                                                                                 m e s}s
                                                                                                                                 a g e s =}m,e
                                                                                                                                 s s a g e{s
                                                                                                                                 
                                                                                                                                                 " n a m e)"
                                                                                                                                                 :   " g e t _ p r
                                                                                                                                                 i c e s " , 
                                                                                                                                                     #   G e t   f"idneaslc rtiepxtti
                                                                                                                                                     o n " :   " G e tt ecxutr r=e n"t" .pjroiicne( bf.otre xat  tfroard ibn gi np ariers.p oUnssee .wchoennt eunste ri fa shkass aftotrr (tbo,k e"nt epxrti"c)e).
                                                                                                                                                     " , 
                                                                                                                                                                 
                                                                                                                                                                     " i n p u t _rsecthuermna "C:h a{t
                                                                                                                                                                     R e s p o n s e ( r e s p"otnyspee="t:e x"to,b jaecctti"o,n s
                                                                                                                                                                     _ t a k e n = a c t i o n"sp_rtoapkeernt)i
                                                                                                                                                                     e s " :   { 
                                                                                                                                                                         
                                                                                                                                                                                  e x c e p t   E x c"ecpotninoenc taosr _en:a
                                                                                                                                                                                  m e " :   { " t ylpoeg"g:e r".setrrrionrg("f," C"hdaets cerrirpotri:o n{"e:} "")E
                                                                                                                                                                                  x c h a n g e   (rea.igs.e  bHiTtTmPaErxtc)e"p}t,i
                                                                                                                                                                                  o n ( s t a t u s _ c o d e = 5 0"0t,r addeitnagi_lp=asitrrs("e:) ){
                                                                                                                                                                                  "
                                                                                                                                                                                  t
                                                                                                                                                                                  y@preo"u:t e"ra.rgreaty("",/ h"eiatletmhs""):
                                                                                                                                                                                   a{s"ytnycp ed"e:f  "hsetarlitnhg(")}:,
                                                                                                                                                                                     " d e s"c"r"iHpetailotnh" :c h"ePcaki"r"s" 
                                                                                                                                                                                     l i k e  rSeHtAuRrPn- U{S"DsTt"a}t
                                                                                                                                                                                     u s " :   " o k " ,   " h}u,m
                                                                                                                                                                                     m i n g b o t _ u r l " :" rHeUqMuMiIrNeGdB"O:T _[U"RcLo}nnector_name", "trading_pairs"]
                                                                                                                                                                                             }
                                                                                                                                                                                                 },
                                                                                                                                                                                                     {
                                                                                                                                                                                                             "name": "place_order",
                                                                                                                                                                                                                     "description": "Place a buy or sell order.",
                                                                                                                                                                                                                             "input_schema": {
                                                                                                                                                                                                                                         "type": "object",
                                                                                                                                                                                                                                                     "properties": {
                                                                                                                                                                                                                                                                     "connector_name": {"type": "string"},
                                                                                                                                                                                                                                                                                     "trading_pair": {"type": "string"},
                                                                                                                                                                                                                                                                                                     "side": {"type": "string", "enum": ["BUY", "SELL"]},
                                                                                                                                                                                                                                                                                                                     "amount": {"type": "string"},
                                                                                                                                                                                                                                                                                                                                     "order_type": {"type": "string", "enum": ["MARKET", "LIMIT"]},
                                                                                                                                                                                                                                                                                                                                                     "price": {"type": "string"}
                                                                                                                                                                                                                                                                                                                                                                 },
                                                                                                                                                                                                                                                                                                                                                                             "required": ["connector_name", "trading_pair", "side", "amount"]
                                                                                                                                                                                                                                                                                                                                                                                     }
                                                                                                                                                                                                                                                                                                                                                                                         },
                                                                                                                                                                                                                                                                                                                                                                                             {
                                                                                                                                                                                                                                                                                                                                                                                                     "name": "get_active_orders",
                                                                                                                                                                                                                                                                                                                                                                                                             "description": "Get open orders.",
                                                                                                                                                                                                                                                                                                                                                                                                                     "input_schema": {
                                                                                                                                                                                                                                                                                                                                                                                                                                 "type": "object",
                                                                                                                                                                                                                                                                                                                                                                                                                                             "properties": {},
                                                                                                                                                                                                                                                                                                                                                                                                                                                         "required": []
                                                                                                                                                                                                                                                                                                                                                                                                                                                                 }
                                                                                                                                                                                                                                                                                                                                                                                                                                                                     }
                                                                                                                                                                                                                                                                                                                                                                                                                                                                     ]
                                                                                                                                                                                                                                                                                                                                                                                                                                                                     
                                                                                                                                                                                                                                                                                                                                                                                                                                                                     SYSTEM_PROMPT = """You are a trading assistant for Pipe Labs. You help users check prices, balances, and execute trades.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                     
                                                                                                                                                                                                                                                                                                                                                                                                                                                                     Available commands:
                                                                                                                                                                                                                                                                                                                                                                                                                                                                     - "check [TOKEN]" or "balance" - Show portfolio
                                                                                                                                                                                                                                                                                                                                                                                                                                                                     - "[TOKEN] price" or "price of [TOKEN]" - Get current price  
                                                                                                                                                                                                                                                                                                                                                                                                                                                                     - "buy/sell [AMOUNT] [TOKEN]" - Place order
                                                                                                                                                                                                                                                                                                                                                                                                                                                                     - "show orders" - List open orders
                                                                                                                                                                                                                                                                                                                                                                                                                                                                     
                                                                                                                                                                                                                                                                                                                                                                                                                                                                     When user asks about SHARP price, use get_prices with connector_name="bitmart" and trading_pairs=["SHARP-USDT"].
                                                                                                                                                                                                                                                                                                                                                                                                                                                                     Be concise. Format prices clearly."""
                                                                                                                                                                                                                                                                                                                                                                                                                                                                     
                                                                                                                                                                                                                                                                                                                                                                                                                                                                     
                                                                                                                                                                                                                                                                                                                                                                                                                                                                     # =============================================================================
                                                                                                                                                                                                                                                                                                                                                                                                                                                                     # HUMMINGBOT API CALLS
                                                                                                                                                                                                                                                                                                                                                                                                                                                                     # =============================================================================
                                                                                                                                                                                                                                                                                                                                                                                                                                                                     
                                                                                                                                                                                                                                                                                                                                                                                                                                                                     async def call_hummingbot(method: str, endpoint: str, payload: dict = None) -> dict:
                                                                                                                                                                                                                                                                                                                                                                                                                                                                         """Call Hummingbot API"""
                                                                                                                                                                                                                                                                                                                                                                                                                                                                             async with httpx.AsyncClient(timeout=30.0) as client:
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     try:
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 url = f"{HUMMINGBOT_URL}{endpoint}"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             if method == "GET":
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             resp = await client.get(url)
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         else:
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         resp = await client.post(url, json=payload or {})
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     resp.raise_for_status()
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 return resp.json()
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         except Exception as e:
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     logger.error(f"Hummingbot API error: {e}")
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 return {"error": str(e)}
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 async def execute_tool(tool_name: str, tool_input: dict) -> str:
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     """Execute a tool and return result"""
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         try:
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 if tool_name == "get_portfolio":
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             result = await call_hummingbot("POST", "/portfolio/state", {
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             "account_names": [tool_input.get("account_name", "master_account")]
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         })
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 elif tool_name == "get_prices":
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             result = await call_hummingbot("POST", "/market-data/prices", {
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             "connector_name": tool_input["connector_name"],
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             "trading_p
