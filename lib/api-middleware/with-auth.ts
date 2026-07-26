import { NextRequest } from 'next/server';
import { decodeToken, userRegisterMidlware } from '../../features/auth/Auth';
import { User } from '@/features/user/user.service.interface';
 
type Handler = (req: NextRequest, context?: any) => Promise<Response>;
 
export function withAuth(handler: Handler): Handler {
  return async (req, context) => {
    const authorizationString = req.headers.get('Authorization');
    if (!authorizationString || !authorizationString.startsWith("Bearer ")) {
      return errorMessageResponse("Missing or invalid token");
    }

    var token = extractTokenString(authorizationString);
    if(token == undefined) return errorMessageResponse("Missing or invalid token");

    var decodedToken = await decodeToken(token);
    if(decodedToken == undefined) return errorMessageResponse("Invalid token");

    var oathUser = await userRegisterMidlware(decodedToken);

    var responceContext: ResponceHandler = {
        context: context,
        user: oathUser
    }
 
    // If authenticated, call the original handler
    return handler(req, responceContext);
  };
}

export function witchUser(handler: Handler): Handler {
    return async (req, context) => {
        var responceAppContext: ResponceHandler = {
            context: context,
            user: null
        }

        const authorizationString = req.headers.get('Authorization');
        if (!authorizationString) {
            return handler(req, responceAppContext);
        }

        if (!authorizationString.startsWith("Bearer ")) {
            return errorMessageResponse("Missing or invalid token");
        }

        var token = extractTokenString(authorizationString);
        if(token == undefined) return errorMessageResponse("Missing or invalid token");

        var decodedToken = await decodeToken(token);
        if(decodedToken == undefined) return errorMessageResponse("Invalid token");

        var oathUser = await userRegisterMidlware(decodedToken);

        var responceContext: ResponceHandler = {
            context: context,
            user: oathUser
        }

        return handler(req, responceContext);
    };
}

export function witchBasic(handler: Handler): Handler {
    return async (req, context) => {
        var responceContext: ResponceHandler = {
            context: context,
            user: null
        }

        return handler(req, responceContext);
    };
}

function errorMessageResponse(message: string, ): Response {
    return new Response(JSON.stringify({ error: message }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
}

function extractTokenString(authorizationString: string): string | undefined {
    var splits = authorizationString.split(" ");
    if(splits.length != 2) return undefined;
    if(splits[0] != "Bearer") return undefined;

    var token = splits[1];
    return token
}

export interface ResponceHandler{
    context?: any,
    user?: User | null
}