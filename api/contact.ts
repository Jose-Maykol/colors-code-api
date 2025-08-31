import type { VercelRequest, VercelResponse } from "@vercel/node";
import { Resend } from "resend";
import { z } from "zod";

const resend = new Resend(process.env.RESEND_API_KEY);

const contactSchema = z.object({
  fullName: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  company: z.string().min(2, "La compañía debe tener al menos 2 caracteres"),
  companySize: z.string().min(1, "El tamaño de la compañía es obligatorio"),
  businessEmail: z.email("Correo electrónico inválido"),
  message: z
    .string()
    .min(10, "El mensaje es demasiado corto")
    .max(1000, "El mensaje es demasiado largo"),
})

const escapeHtml = (text: string): string => {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\n/g, "<br/>")
}


export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      message: "Método no permitido",
    });
  }

  try {
    const data = contactSchema.parse(req.body);

    const emailResponse = await resend.emails.send({
      from: "onboarding@resend.dev",
      to: "colorscoude@gmail.com",
      subject: `Nuevo contacto de ${data.company} - ${data.fullName}`,
      replyTo: data.businessEmail,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Nuevo mensaje de contacto</h2>
          <div style="background: #f9f9f9; padding: 20px; border-radius: 8px;">
            <p><strong>Nombre:</strong> ${escapeHtml(data.fullName)}</p>
            <p><strong>Compañía:</strong> ${escapeHtml(data.company)}</p>
            <p><strong>Tamaño:</strong> ${escapeHtml(data.companySize)}</p>
            <p><strong>Email:</strong> <a href="mailto:${data.businessEmail}">${data.businessEmail}</a></p>
            <div style="margin-top: 20px;">
              <strong>Mensaje:</strong><br/>
              <div style="background: white; padding: 15px; border-radius: 4px; margin-top: 10px;">
                ${escapeHtml(data.message)}
              </div>
            </div>
          </div>
          <p style="color: #666; font-size: 12px; margin-top: 20px;">
            Enviado el ${new Date().toLocaleString("es-ES")}
          </p>
        </div>
      `,
    })

    if (emailResponse.error) {
      console.error("Error enviando email:", emailResponse.error)
      return res.status(500).json({
        success: false,
        message: "Error al enviar el correo electrónico",
      })
    }

    return res.status(201).json({
      success: true,
      data: {
        id: emailResponse.data?.id,
      },
      message: "Correo electrónico enviado correctamente",
    });
  } catch (error) {

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: "Datos inválidos",
        errors: error.issues.map(issue => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      })
    }

    return res.status(500).json({
      success: false,
      message: "Error interno del servidor",
    })
  }
}
