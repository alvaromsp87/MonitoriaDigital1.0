// 📁 app/api/auth/jitsi-jwt/route.ts
import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken'; 

// --- Configurações JaaS (sem alterações aqui) ---
const JAAS_APP_ID = "vpaas-magic-cookie-def7a752b0214eeeb6c8ee7cabfb2a6b"; 
const JAAS_API_KEY_ID_FULL = "vpaas-magic-cookie-def7a752b0214eeeb6c8ee7cabfb2a6b/37a24a";
const JAAS_PRIVATE_KEY = `-----BEGIN PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCzgsP9J0ymv0so
W/40lqba27NNozJpyDiCggYE8ZeJfzFTBhcIhyNKAhhO2ex3OSU2aniYH+rqjzv2
0JwKDL6K+7gxMQqNI3d0u4ObQOOS/ziw9pBGsVzy7GpEEkmJOf74M+fyUnJgIoiR
ebr0cSXl9aJx42cm+WLYbxPftjYjgJNqlHpIvY8MRJiqzpcq7ivTiSZVtyXJdPMC
4ACmEXWKkowSrdvO8ULcxKEC+h5ik6u7HgYrHcQ7Ae6Odl2DbxrpHvIdXDj1q2iF
umddKfUfJk1FzG0TKAwGEv+fJFV0wO0Yjbnow3xXPpczbDiOsfrso8e4WAKUQCu/
VDqSxJmXAgMBAAECggEBAJZN1YCwWTP9VBbVAAJUah0ye+1zyhBcf0R3TkbxaqrL
/ya/IKYZUOj03BmZyq8BADGR8KufffksOU8t2JlpllmU7uLxZx5KJgltwIJMUMCS
RouVx7QJagRVA50/mqb2EpEMFRgHBJGOGL+GJ43o94yWoY+ukn5Frgf+6asVTDto
Uz2NQvWE+EB9aKszhwzUVsMMPYXJaUXjaR1IOw65x3XXxOCBPalgIaodaacuM5aD
3u9q9KS/WIAwSc4juYDxeFsxsGn4zMvmWnOSJp9c6EPYmMWZcwhP9QcWEozDTHeK
orMGYztzUPDaMUJd7wuFFdPQlQVPiFkmqtGEFgasdnECgYEA5SBKqvv+PxJ8EpRU
csvjTA7b4f0qdWIifzE92Tmod9zDVJBSK4D/mUnYzNLQovVCQWe6Yz1nniQOzhaS
4ay4+vPQ0h26VKdXKJfgQB7hrsn5Huat4J3JIoxyIq2+5pG4cdqNzlFqyPe4upEy
oS68xoZzihcA5SbgBY82e+/s8tMCgYEAyJC7Ip4BtYWOJaBoklal3UenOj2qBOTs
9dOMmVp0U5rfR9FNfKhPfnmvxQ0lPhXPY3Y6y/S8xuSgd9/GtdMPBPsSOaiveTBf
eP6dvzhedt3FPwaI7B/24WF3dymOl+sW6h4hji9Fm9TisxBYzfEjp6BQubw6ZbnQ
uxBjbT4u260CgYEA2Bpg0mviHLLeeteT3sIWm4HYOYmCJjxstPJIlz0efA6n3HZS
Sd3dNULFTEn5pfkUiIPA9CDSPgFcRVxdJKS3w1l6tvJ676T1O8AjLdbynNy6Lj77
+EJZllBIxhSBXQ5LnHa6EMIRqYKbpLuVuRhPzB67kp6npXnJCPVOOg7MuSkCgYAN
Ze26YEfI8oUOamrR68vkvlajg18KOKjDu0AXNn2y4BOuXoMIos28qzBcv4YPYbGa
+VjwKwc5WiiGGYLSvqiwMn2DMIuYUuztzkSHc6KL2kDE9xDKhVAeuj4azcHi0CeV
uDGRqALEaDJEuADWsRcqqYD7B2H3TbRt6qhZsd+7eQKBgEWzxqJkn5dYcGQcblXD
Ey6EBO9vKfFjE9Iikd2HB9z+JbtH9Mel6DKm2+f6PfQvGYg/cMsarTsdMpf6HAII
D0UlqvHQeiLh9FRGFREeqahbYGuN9ry8t2pR6ygXt5F+O4maUp2BQX+73lhVxDhK
HMilmalJpFKLp1ouDLVJH1dT
-----END PRIVATE KEY-----`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, userName, userEmail, roomName: roomNameBase } = body;

    if (!userId || !userName || !roomNameBase) {
      return NextResponse.json({ error: "Dados insuficientes (userId, userName, roomName) para gerar JWT" }, { status: 400 });
    }
    
    if (!JAAS_PRIVATE_KEY || JAAS_PRIVATE_KEY.length < 1000 || !JAAS_PRIVATE_KEY.startsWith("-----BEGIN PRIVATE KEY-----")) {
        console.error("[API /api/auth/jitsi-jwt] ERRO CRÍTICO: JAAS_PRIVATE_KEY parece inválida ou incompleta.");
        return NextResponse.json({ error: "Configuração do servidor JaaS (Chave Privada) incompleta ou incorreta." }, { status: 500 });
    }

    const nowInSeconds = Math.floor(Date.now() / 1000);
    const expirationInSeconds = nowInSeconds + (2 * 60 * 60); 

    // *** INÍCIO DA CORREÇÃO ***
    // O campo 'room' no payload do JWT deve conter APENAS o nome base da sala.
    // O Jitsi combina o 'sub' (AppID) com o 'room' (nome base) para formar o nome completo.
    const payload = {
      aud: "jitsi",
      iss: "chat", 
      iat: nowInSeconds,
      nbf: nowInSeconds - 10, 
      exp: expirationInSeconds,
      sub: JAAS_APP_ID,
      context: {
        user: {
          id: String(userId), 
          name: userName,
          avatar: "", 
          email: userEmail || undefined, 
          moderator: "true", 
        },
        features: { 
          "livestreaming": "false", 
          "outbound-call": "false",
          "sip-outbound-call": "false",
          "transcription": "false",
          "recording": "false", 
        }
      },
      room: roomNameBase, // CORRIGIDO: Usar apenas o nome base da sala.
    };
    // *** FIM DA CORREÇÃO ***
    
    console.log("[API /api/auth/jitsi-jwt] Gerando token com payload:", JSON.stringify(payload, null, 2));
    
    const token = jwt.sign(payload, JAAS_PRIVATE_KEY, { 
        algorithm: 'RS256', 
        header: {
            alg: 'RS256',
            typ: 'JWT',
            kid: JAAS_API_KEY_ID_FULL 
        }
    });

    console.log("[API /api/auth/jitsi-jwt] Token JWT gerado com sucesso.");
    return NextResponse.json({ jwt: token });

  } catch (error: unknown) {
    console.error("[API /api/auth/jitsi-jwt] Erro detalhado ao gerar JWT:", error);
    let errorMessage = "Falha ao gerar token de autenticação";
    if (error instanceof Error) {
        errorMessage = error.message;
    }
    return NextResponse.json({ error: errorMessage, stack: (error instanceof Error ? error.stack : undefined) }, { status: 500 });
  }
}