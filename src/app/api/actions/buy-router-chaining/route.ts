import {
  ActionPostResponse,
  createPostResponse,
  MEMO_PROGRAM_ID,
  ActionGetResponse,
  ActionPostRequest,
  createActionHeaders,
  ActionError,
} from "@solana/actions";
import {
  clusterApiUrl,
  ComputeBudgetProgram,
  Connection,
  PublicKey,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";

const headers = createActionHeaders();

export const GET = async (req: Request) => {
  const payload: ActionGetResponse = {
    title: "Provide Personal Information",
    icon: new URL("/image.png", new URL(req.url).origin).toString(),
    description:
      "Please enter your personal details below before purchasing a router.",
    label: "Next Step",
    links: {
      actions: [
        {
          href: `/api/actions/buy-router-chaining?fullName={fullName}&email={email}&country={country}`,
          type: "post", // This will make a POST request
          label: "Submit Information",
          parameters: [
            {
              name: "fullName",
              label: "Full Name",
              type: "text",
              required: true,
              patternDescription: "Please enter your full name",
            },
            {
              name: "email",
              label: "Email Address",
              type: "email",
              required: true,
              patternDescription: "Please enter a valid email address",
            },
            {
              name: "country",
              label: "Country/Region",
              type: "text",
              required: true,
              patternDescription: "Please enter your country or region",
            },
          ],
        },
      ],
    },
  };

  return Response.json(payload, {
    headers,
  });
};

export const OPTIONS = async () => Response.json(null, { headers });

export const POST = async (req: Request) => {
  try {
    const body: ActionPostRequest<{
      fullName: string;
      email: string;
      country: string;
    }> & {
      params: ActionPostRequest<{
        fullName: string;
        email: string;
        country: string;
      }>["data"];
    } = await req.json();

    console.log(body.data);

    const fullName = body.params?.fullName || body.data?.fullName;
    const email = body.params?.email || body.data?.email;
    const country = body.params?.country || body.data?.country;

    if (!fullName || !email || !country) {
      throw 'Missing "fullName", "email", or "country" in the request';
    }

    console.log(
      `Extracted Info - Full Name: ${fullName}, Email: ${email}, Country: ${country}`,
    );

    let account: PublicKey;
    try {
      account = new PublicKey(body.account);
    } catch (err) {
      throw 'Invalid "account" provided';
    }

    const orderResponse = await callCreateOrderAPI(
      fullName,
      email,
      country,
      account.toBase58(),
    );

    console.log("KYC Order Created:", orderResponse);

    // Define the next action (inline) for router selection after KYC is complete
    const payload: ActionPostResponse = {
      type: "message",
      data: "KYC information submitted successfully. Please proceed to select your router.",
      links: {
        next: {
          type: "inline", // Inline action to move to the next step
          action: {
            type: "action", // This defines the next action to choose the router
            title: "Select Your Router",
            icon: new URL("/image.png", new URL(req.url).origin).toString(),
            description: "Select the number of routers you want to buy.",
            label: "Select Router",
            links: {
              actions: [
                {
                  type: "transaction",
                  label: "Buy 1 Router",
                  href: `/api/actions/buy-router-chaining/router-purchase?routers=1&account=${account.toBase58()}`,
                },
                {
                  type: "transaction",
                  label: "Buy 5 Routers",
                  href: `/api/actions/buy-router-chaining/router-purchase?routers=5&account=${account.toBase58()}`,
                },
                {
                  type: "transaction",
                  label: "Buy 10 Routers",
                  href: `/api/actions/buy-router-chaining/router-purchase?routers=10&account=${account.toBase58()}`,
                },
              ],
            },
          },
        },
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

async function callCreateOrderAPI(
  fullName: string,
  email: string,
  country: string,
  account: string,
) {
  console.log("Calling KYC API with the following data:", {
    fullName,
    email,
    country,
    account,
  });

  // Simulate a KYC order creation with a mock response
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        success: true,
        orderId: "1234ABC",
      });
    }, 1000);
  });
}
