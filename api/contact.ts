import type { VercelRequest, VercelResponse } from "@vercel/node"
import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      message: "Método no permitido",
    })
  }

  const { fullName, company, companySize, businessEmail, message } = req.body

  if (!fullName || !company || !companySize || !businessEmail || !message) {
    return res.status(400).json({
      success: false,
      message: "Faltan campos obligatorios",
    })
  }

  try {
    const emailResponse = await resend.emails.send({
      from: "onboarding@resend.dev",
      to: "colorscoude@gmail.com",
      subject: "Contacto Colors Code",
      html: `
        <h2>Nuevo mensaje de contacto</h2>
        <p><strong>Nombre completo:</strong> ${fullName}</p>
        <p><strong>Compañía:</strong> ${company}</p>
        <p><strong>Tamaño de la compañía:</strong> ${companySize}</p>
        <p><strong>Correo empresarial:</strong> ${businessEmail}</p>
        <p><strong>Mensaje:</strong><br/>${message}</p>
      `,
    })

    return res.status(200).json({
      success: true,
      id: emailResponse.data?.id,
      message: "Correo electrónico enviado correctamente",
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error al enviar el correo electrónico",
    })
  }
}
