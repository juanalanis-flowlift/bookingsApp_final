import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";

const CONTENT = {
    en: `FLOWLIFT TERMS AND CONDITIONS

Last updated: 01/27/2026

These Terms and Conditions (“Terms”) govern access to and use of the flowlift platform (“flowlift”, “Platform”, “Service”), operated by Juan Alanis, acting as Persona Física con Actividad Empresarial, with address at Paseo de la Turquesa #407, San Patricio Plus, 25204, Saltillo, Coahuila, México.

By registering an account or using the Platform as a business user (“Business”, “You”), you agree to be bound by these Terms.

1. Nature of the Service
flowlift is a booking management platform that enables businesses to receive and manage booking requests from end customers.
flowlift acts solely as a booking agent and technology provider on behalf of businesses. flowlift does not provide services to end customers, does not control service delivery, and is not a party to any agreement between businesses and their customers.

2. Eligibility and Account Registration
Only individuals or entities legally capable of conducting commercial activities may register as Business users.
You are responsible for:
Maintaining accurate account information
Safeguarding login credentials
All activities occurring under your account

3. End Customers
End customers do not create accounts with flowlift.
By accessing booking pages, end customers implicitly accept flowlift’s platform usage terms. However, all commercial, service, and contractual relationships exist exclusively between the Business and the end customer.
flowlift bears no responsibility for customer behavior, attendance, cancellations, or disputes.

4. Bookings and Availability
Booking confirmations may be:
Automatically confirmed, or
Subject to business approval
flowlift does not guarantee booking fulfillment, availability accuracy, or customer attendance.
Each Business is solely responsible for:
Defining availability
Managing confirmations
Honoring accepted bookings

5. Cancellations, No-Shows and Policies
Each Business defines its own:
Cancellation policies
No-show rules
Service conditions
flowlift only displays such policies and does not enforce them.
flowlift is not responsible for enforcing penalties, issuing refunds, or resolving disputes.

6. Fees, Subscriptions and Trials
flowlift operates under a subscription model with monthly and/or annual plans, priced in USD.
A 14-day free trial may be offered
Subscriptions may be canceled at any time
Refunds are pro-rated, unless otherwise stated
Failure to pay may result in account suspension or termination.

7. Payments and Future Integrations
Currently, flowlift does not process payments from end customers.
You acknowledge and agree that flowlift may integrate third-party payment providers (including Stripe) in the future. Use of such services will be subject to additional terms.

8. Data and Content Ownership
Businesses retain ownership of:
Logos
Business information
Booking data
Customer information
By using flowlift, you grant flowlift a non-exclusive, worldwide, royalty-free license to use such data solely for operating, improving, and promoting the Platform.

9. Data Protection and Privacy
flowlift processes personal data in accordance with applicable Mexican data protection laws.
Data may be stored using third-party infrastructure, including Replit and Supabase.
Businesses are responsible for ensuring they have lawful grounds to collect and process customer data.

10. Prohibited Use
You may not use flowlift for:
Illegal or fraudulent activities
Misrepresentation
Infringement of rights
Harmful or abusive conduct
Use of the Platform for illegal purposes will result in immediate termination without refund.

11. Suspension and Termination
flowlift reserves the right to:
Suspend or terminate accounts
Remove content
Restrict access
Upon termination, access to the Platform is revoked immediately, with no obligation to provide data retention or export.

12. Disclaimers
The Platform is provided “as is” and “as available.”
flowlift makes no warranties regarding:
Platform uptime
Booking success
Customer behavior
Business outcomes

13. Limitation of Liability
To the maximum extent permitted by law, flowlift’s total liability shall not exceed the fees paid by the Business in the preceding three (3) months.
flowlift shall not be liable for indirect, incidental, or consequential damages.

14. Indemnification
You agree to indemnify and hold flowlift harmless from any claims arising from:
Your services
Customer disputes
Legal non-compliance
Misuse of the Platform

15. Governing Law and Dispute Resolution
These Terms are governed by the laws of Mexico.
Any dispute shall be resolved by binding arbitration in Saltillo, Coahuila, and parties waive the right to class or collective actions.

16. Modifications
flowlift may update these Terms from time to time. Continued use constitutes acceptance of the updated Terms.

17. Contact
For legal notices or inquiries:
📧 juan.alanis@flowlift.co`,
    es: `1. TÉRMINOS Y CONDICIONES DE FLOWLIFT

Versión legal en español (México)

Última actualización: 27/01/2026

Los presentes Términos y Condiciones (“Términos”) regulan el acceso y uso de la plataforma tecnológica denominada flowlift (la “Plataforma” o el “Servicio”), operada por Juan Alanis, actuando como Persona Física con Actividad Empresarial, con domicilio en Paseo de la Turquesa #407, San Patricio Plus, C.P. 25204, Saltillo, Coahuila, México.

Al registrarse y utilizar la Plataforma como usuario comercial (el “Negocio” o “Usuario”), usted acepta expresamente quedar obligado por los presentes Términos.

1. Naturaleza del Servicio
flowlift es una plataforma tecnológica de gestión de reservaciones que permite a negocios recibir y administrar solicitudes de reserva realizadas por clientes finales.
flowlift actúa únicamente como intermediario tecnológico y agente de reservaciones, y no presta servicios al cliente final, no controla la ejecución de los servicios del Negocio ni forma parte de la relación contractual entre el Negocio y sus clientes.

2. Registro y Uso de la Cuenta
El Servicio está disponible únicamente para personas físicas o morales legalmente capacitadas para realizar actividades comerciales.
El Usuario es responsable de:
La veracidad de la información proporcionada
El uso de sus credenciales de acceso
Todas las actividades realizadas desde su cuenta

3. Clientes Finales
Los clientes finales no crean cuentas en flowlift.
El acceso y uso de las páginas de reservación implica una aceptación tácita de las condiciones de uso de la Plataforma. No obstante, toda relación comercial, contractual o de servicio existe exclusivamente entre el Negocio y el cliente final.
flowlift no asume responsabilidad alguna por el comportamiento de los clientes, inasistencias, cancelaciones o disputas.

4. Reservaciones y Disponibilidad
Las reservaciones pueden:
Confirmarse automáticamente, o
Requerir aprobación del Negocio
flowlift no garantiza la exactitud de la disponibilidad ni la asistencia del cliente final.
El Negocio es el único responsable de:
Definir su disponibilidad
Confirmar o rechazar solicitudes
Cumplir con las reservaciones aceptadas

5. Cancelaciones y Políticas del Negocio
Cada Negocio define sus propias políticas de:
Cancelación
Inasistencias
Condiciones del servicio
flowlift se limita a mostrar dichas políticas y no las aplica ni las hace cumplir, ni participa en disputas o reembolsos.

6. Suscripciones, Tarifas y Pruebas
flowlift opera bajo un modelo de suscripción mensual y/o anual, con precios establecidos en USD.
Puede ofrecerse un periodo de prueba de 14 días
El Usuario puede cancelar su suscripción en cualquier momento
Los reembolsos serán prorrateados, salvo indicación expresa en contrario
La falta de pago podrá resultar en la suspensión o cancelación del Servicio.

7. Pagos e Integraciones Futuras
Actualmente, flowlift no procesa pagos de clientes finales.
El Usuario acepta que flowlift podrá integrar en el futuro proveedores de pago de terceros, incluyendo Stripe, los cuales estarán sujetos a términos adicionales.

8. Propiedad de la Información
El Negocio conserva la titularidad de:
Logotipos
Información comercial
Datos de reservaciones
Datos de clientes
El Usuario otorga a flowlift una licencia no exclusiva, mundial y libre de regalías para usar dicha información exclusivamente para la operación, mejora y promoción de la Plataforma.

9. Protección de Datos Personales
flowlift procesa datos personales conforme a la legislación mexicana aplicable en materia de protección de datos.
La información podrá alojarse en infraestructura de terceros, incluyendo Replit y Supabase.
El Negocio garantiza que cuenta con base legal para recabar y tratar los datos de sus clientes.

10. Uso Prohibido
Queda estrictamente prohibido utilizar la Plataforma para:
Actividades ilegales o fraudulentas
Representaciones falsas
Violación de derechos de terceros
El uso indebido o ilegal dará lugar a la terminación inmediata del contrato sin derecho a reembolso.

11. Suspensión y Terminación
flowlift se reserva el derecho de:
Suspender o cancelar cuentas
Eliminar contenido
Restringir el acceso
En caso de terminación, el acceso se revocará de forma inmediata, sin obligación de conservar o entregar información.

12. Exclusión de Garantías
La Plataforma se proporciona “tal cual” y “según disponibilidad”.
flowlift no garantiza:
Disponibilidad continua
Resultados comerciales
Cumplimiento de reservaciones

13. Limitación de Responsabilidad
La responsabilidad total de flowlift no excederá el monto pagado por el Usuario durante los tres (3) meses anteriores al evento que origine la reclamación.
En ningún caso flowlift será responsable por daños indirectos o consecuenciales.

14. Indemnización
El Usuario se obliga a sacar en paz y a salvo a flowlift de cualquier reclamación derivada de:
Sus servicios
Disputas con clientes
Incumplimiento legal
Uso indebido de la Plataforma

15. Legislación Aplicable y Jurisdicción
Estos Términos se rigen por las leyes de los Estados Unidos Mexicanos.
Cualquier controversia será resuelta mediante arbitraje vinculante en Saltillo, Coahuila, renunciando las partes a acciones colectivas.

16. Modificaciones
flowlift podrá modificar estos Términos en cualquier momento. El uso continuado del Servicio implica aceptación de las modificaciones.

17. Contacto
📧 juan.alanis@flowlift.co`
};

export default function TermsAndConditions() {
    const { language, t } = useI18n();
    const content = CONTENT[language as keyof typeof CONTENT] || CONTENT.en;

    return (
        <div className="min-h-screen bg-white">
            <header className="sticky top-0 z-50 bg-white border-b h-20 flex items-center">
                <div className="container mx-auto px-4 flex items-center justify-between">
                    <Link href="/">
                        <div className="flex items-center gap-2 group cursor-pointer text-gray-600 hover:text-black font-semibold">
                            <ArrowLeft className="h-5 w-5 transition-transform group-hover:-translate-x-1" />
                            {t("common.back")}
                        </div>
                    </Link>
                    <h1 className="text-xl font-bold font-serif">{t("nav.termsConditions")}</h1>
                    <div className="w-20" /> {/* Spacer */}
                </div>
            </header>

            <main className="container mx-auto px-4 py-16 max-w-4xl">
                <div className="prose prose-slate max-w-none font-sans">
                    {content.split('\n').map((line, i) => (
                        <p key={i} className={line.match(/^[0-9]+\.|^[A-Z]\./) ? "font-bold mt-8 text-xl" : "mb-4"}>
                            {line}
                        </p>
                    ))}
                </div>
            </main>
        </div>
    );
}
