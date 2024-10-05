/**
 * Solana Actions Example
 */

import {
  ActionPostResponse,
  createPostResponse,
  ActionGetResponse,
  ActionPostRequest,
  createActionHeaders,
  ActionError,
} from "@solana/actions";
import {
  clusterApiUrl,
  Connection,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js";
import * as web3 from "@solana/web3.js";

// Admin public key for funds to be sent to
const ADMIN_PUBKEY = new PublicKey(
  "3MKLb89FZvGeLTY8QHAfGevSTkqdmRVAYU97Qc1Roct2",
);
// Price of 1 router in SOL
const PRICE_PER_ROUTER_SOL = 1.4214;

// create the standard headers for this route (including CORS)
const headers = createActionHeaders();

export const GET = async (req: Request) => {
  try {
    const requestUrl = new URL(req.url);

    const baseHref = new URL(
      `/api/actions/buy-router-chaining/router-purchase`,
      requestUrl.origin,
    ).toString();

    const payload: ActionGetResponse = {
      type: "action",
      title: "Buy Router - Solana Action",
      icon: new URL("/image.png", requestUrl.origin).toString(),
      description: "Select the number of routers to buy",
      label: "Buy Router",
      links: {
        actions: [
          {
            type: "transaction",
            label: "Buy 1 Router",
            href: `${baseHref}?routers=1`,
          },
          {
            type: "transaction",
            label: "Buy 5 Routers",
            href: `${baseHref}?routers=5`,
          },
          {
            type: "transaction",
            label: "Buy 10 Routers",
            href: `${baseHref}?routers=10`,
          },
          {
            type: "transaction",
            label: "Buy Custom Number of Routers",
            href: `${baseHref}?routers={routers}`, // Input box for routers
            parameters: [
              {
                name: "routers",
                label: "Enter number of routers",
                required: true,
              },
            ],
          },
        ],
      },
    };

    return Response.json(payload, {
      headers,
    });
  } catch (err) {
    console.log(err);
    let actionError: ActionError = { message: "An unknown error occurred" };
    if (typeof err == "string") actionError.message = err;
    return Response.json(actionError, {
      status: 400,
      headers,
    });
  }
};

// DO NOT FORGET TO INCLUDE THE `OPTIONS` HTTP METHOD
// THIS WILL ENSURE CORS WORKS FOR BLINKS
export const OPTIONS = async () => Response.json(null, { headers });

export const POST = async (req: Request) => {
  try {
    const requestUrl = new URL(req.url);

    const routers = parseInt(requestUrl.searchParams.get("routers") || "0", 10);

    const body: ActionPostRequest = await req.json();

    if (!routers || routers <= 0) {
      throw 'Invalid "routers" value provided';
    }

    // validate the client provided input
    let account: PublicKey;
    try {
      account = new PublicKey(body.account);
    } catch (err) {
      throw 'Invalid "account" provided';
    }

    const connection = new Connection(
      process.env.SOLANA_RPC! || clusterApiUrl("devnet"),
    );

    const totalSolAmount = routers * PRICE_PER_ROUTER_SOL;

    let ixs: web3.TransactionInstruction[] = [];

    // Solana transfer instruction
    const transferSolInstruction = web3.SystemProgram.transfer({
      fromPubkey: account,
      toPubkey: ADMIN_PUBKEY,
      lamports: totalSolAmount * LAMPORTS_PER_SOL,
    });

    ixs.push(transferSolInstruction);

    const { blockhash } = await connection.getLatestBlockhash();

    console.log("Publishing Transaction now");

    const transaction = new web3.Transaction({
      recentBlockhash: blockhash,
      feePayer: account,
    }).add(...ixs);

    console.log(transaction);

    const payload: ActionPostResponse = await createPostResponse({
      fields: {
        type: "transaction",
        transaction,
        message: `Purchased ${routers} routers for ${totalSolAmount} SOL!`,
      },
    });

    return Response.json(payload, {
      headers,
    });
  } catch (err) {
    console.log(err);
    let actionError: ActionError = { message: "An unknown error occurred" };
    if (typeof err == "string") actionError.message = err;
    return Response.json(actionError, {
      status: 400,
      headers,
    });
  }
};

// Function to handle external API call for purchasing routers (if needed)
// async function callBuyRouterApi({
//   account,
//   routers,
// }: {
//   account: string;
//   routers: number;
// }) {
//   try {
//     const response = await fetch(BUY_ROUTER_API_URL, {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify({
//         account,
//         routers,
//       }),
//     });

//     if (!response.ok) {
//       throw new Error("API call failed");
//     }

//     const data = await response.json();
//     return data;
//   } catch (error) {
//     console.error("Error in calling router API:", error);
//     return { success: false };
//   }
// }
