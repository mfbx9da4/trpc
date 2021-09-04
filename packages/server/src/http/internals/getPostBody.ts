import { TRPCError } from '../../TRPCError';
import { BaseRequest } from '../../internals/BaseHandlerOptions';

export async function getPostBody({
  req,
  maxBodySize,
}: {
  req: BaseRequest;
  maxBodySize?: number;
}) {
  return new Promise<
    { ok: true; data: unknown } | { ok: false; error: TRPCError }
  >((resolve) => {
    if (req.hasOwnProperty('body')) {
      resolve(req.body);
      return;
    }
    let body = '';
    let hasBody = false;
    req.on('data', function (data) {
      body += data;
      hasBody = true;
      if (typeof maxBodySize === 'number' && body.length > maxBodySize) {
        resolve({
          ok: false,
          error: new TRPCError({ code: 'PAYLOAD_TOO_LARGE' }),
        });
        req.socket.destroy();
      }
    });
    req.on('end', () => {
      try {
        resolve({
          ok: true,
          data: hasBody ? JSON.parse(body) : undefined,
        });
      } catch (err) {
        resolve({
          ok: false,
          error: new TRPCError({ code: 'PARSE_ERROR', originalError: err }),
        });
      }
    });
  });
}
