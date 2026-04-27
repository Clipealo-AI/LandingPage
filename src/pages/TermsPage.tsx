import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SEOHead from '@/components/SEOHead';

const TermsPage = () => {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <SEOHead
        title="Términos y Condiciones"
        description="Términos y Condiciones de Servicio de Clipealo. Conoce las reglas, derechos y obligaciones aplicables al uso de nuestra plataforma de generación de clips con IA."
        canonicalPath="/terminos-y-condiciones"
      />
      <Header />

      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-24">
        <header className="mb-12 border-b border-border pb-8">
          <h1 className="font-display text-4xl sm:text-5xl font-bold mb-4 text-foreground">
            Términos y Condiciones de Servicio
          </h1>
          <p className="text-muted-foreground text-sm">
            Fecha de entrada en vigor: 8 de febrero de 2026 · Versión 1.0
          </p>
        </header>

        <div className="space-y-10 text-foreground/90 leading-relaxed">
          <Section title="1. INTRODUCCIÓN">
            <p>
              Bienvenido a <strong>Clipealo</strong>. Al acceder o utilizar nuestra plataforma de generación automática de clips para streamers, usted acepta obligarse por estos Términos y Condiciones. Si no está de acuerdo con alguna disposición, no utilice el servicio.
            </p>
            <SubSection title="1.1 Información de Contacto">
              <p>Correo electrónico: <a className="text-primary hover:underline" href="mailto:clipealoai@gmail.com">clipealoai@gmail.com</a><br />Soporte técnico: Discord (disponible en la plataforma) o clipealoai@gmail.com</p>
            </SubSection>
            <SubSection title="1.2 Proveedor del Servicio">
              <p>Clipealo es un servicio operado en Perú. La información de registro corporativo se actualizará cuando esté disponible.</p>
            </SubSection>
          </Section>

          <Section title="2. ELEGIBILIDAD Y CAPACIDAD">
            <SubSection title="2.1 Requisitos de Edad">
              <p>Para utilizar los Servicios debe ser mayor de 18 años. Los menores de 18 años solo podrán acceder con el consentimiento expreso y supervisión de sus padres o tutores legales.</p>
            </SubSection>
            <SubSection title="2.2 Capacidad Legal">
              <p>Usted declara y garantiza que posee plena capacidad legal para contratar conforme al Código Civil Peruano y demás normativa aplicable.</p>
            </SubSection>
            <SubSection title="2.3 Usuarios Empresariales">
              <p>Si utiliza los Servicios en representación de una persona jurídica, declara contar con las facultades suficientes para obligar a dicha entidad y que ésta acepta los presentes términos.</p>
            </SubSection>
          </Section>

          <Section title="3. NATURALEZA DEL SERVICIO">
            <SubSection title="3.1 Clipealo como Herramienta Tecnológica">
              <p>Clipealo es exclusivamente una herramienta tecnológica que proporciona:</p>
              <ul>
                <li>Algoritmos de inteligencia artificial para analizar transmisiones</li>
                <li>Capacidad automatizada de generar clips de video</li>
                <li>Infraestructura de almacenamiento temporal</li>
                <li>Interfaz para gestión de contenido</li>
              </ul>
            </SubSection>
            <SubSection title="3.2 Rol Limitado de Clipealo">
              <p>Clipealo actúa únicamente como proveedor de tecnología. NO participa en:</p>
              <ul>
                <li>La creación del contenido original del usuario</li>
                <li>Las decisiones sobre qué contenido transmitir</li>
                <li>La edición o modificación manual de clips</li>
                <li>La distribución o publicación de contenido</li>
                <li>El uso final que el usuario dé a los clips generados</li>
              </ul>
            </SubSection>
            <SubSection title="3.3 Integración con Plataformas de Terceros">
              <p>El servicio permite integración con plataformas de streaming de terceros (Twitch, YouTube, Facebook Gaming, entre otras). Clipealo no controla, opera ni es responsable de dichas plataformas.</p>
            </SubSection>
          </Section>

          <Section title="4. CUENTA DE USUARIO">
            <SubSection title="4.1 Registro y Obligaciones">
              <p>Al crear una cuenta, usted se compromete a:</p>
              <ul>
                <li>Proporcionar información veraz, exacta, actual y completa</li>
                <li>Mantener la confidencialidad de sus credenciales de acceso</li>
                <li>Notificar inmediatamente cualquier uso no autorizado de su cuenta</li>
                <li>No permitir que terceros utilicen su cuenta</li>
              </ul>
            </SubSection>
            <SubSection title="4.2 Responsabilidad por el Uso de la Cuenta">
              <p>Usted es el único responsable de todas las actividades que se realicen bajo su cuenta, independientemente de si fueron autorizadas por usted.</p>
            </SubSection>
            <SubSection title="4.3 Protección de Datos Personales">
              <p>El tratamiento de sus datos personales se realiza conforme a la Ley N° 29733 - Ley de Protección de Datos Personales y su Reglamento. Consulte nuestra <a className="text-primary hover:underline" href="/politica-de-privacidad">Política de Privacidad</a> para mayor información.</p>
              <p>Usted tiene derecho a acceder, rectificar, cancelar y oponerse al tratamiento de sus datos. Para ejercer estos derechos, contacte a clipealoai@gmail.com.</p>
            </SubSection>
          </Section>

          <Section title="5. USOS PERMITIDOS Y PROHIBIDOS">
            <SubSection title="5.1 Usos Permitidos">
              <ul>
                <li>Generar clips de sus propias transmisiones en vivo</li>
                <li>Editar y optimizar el contenido generado</li>
                <li>Distribuir los clips a través de sus canales autorizados</li>
                <li>Monetizar el contenido cuando cuente con plan de pago</li>
              </ul>
            </SubSection>
            <SubSection title="5.2 Conductas Prohibidas">
              <p><strong>a) Respecto al contenido:</strong></p>
              <ul>
                <li>Contenido pornográfico o sexualmente explícito</li>
                <li>Contenido que promueva discriminación, odio, violencia o acoso</li>
                <li>Contenido que explote o ponga en riesgo a menores</li>
                <li>Fraudes, estafas o actividades ilícitas</li>
                <li>Uso no autorizado de contenido, marcas, música o material de terceros</li>
                <li>Suplantación de identidad o uso no consentido de imagen o voz</li>
                <li>Deepfakes o manipulaciones engañosas</li>
              </ul>
              <p><strong>b) Respecto a la plataforma:</strong></p>
              <ul>
                <li>Acceder sin autorización a sistemas, cuentas o datos</li>
                <li>Realizar ingeniería inversa o extraer código fuente</li>
                <li>Utilizar bots, scrapers o herramientas no autorizadas</li>
                <li>Sobrecargar la infraestructura del servicio</li>
                <li>Revender o sublicenciar el servicio</li>
                <li>Desarrollar productos competidores con nuestra tecnología</li>
                <li>Eludir medidas de seguridad</li>
              </ul>
              <p><strong>c) Violación de normativa:</strong></p>
              <ul>
                <li>Ley de Delitos Informáticos (Ley N° 30096)</li>
                <li>Decreto Legislativo N° 822 sobre Derecho de Autor</li>
                <li>Ley de Protección de Datos Personales (Ley N° 29733)</li>
                <li>Cualquier otra violación a la legislación peruana aplicable</li>
              </ul>
            </SubSection>
            <SubSection title="5.3 Consecuencias del Incumplimiento">
              <ul>
                <li>Suspensión o terminación inmediata de la cuenta</li>
                <li>Eliminación de todo el contenido asociado</li>
                <li>Pérdida de derechos a reembolso</li>
                <li>Reporte a autoridades competentes</li>
                <li>Inicio de acciones legales según corresponda</li>
              </ul>
            </SubSection>
          </Section>

          <Section title="6. RESPONSABILIDAD EXCLUSIVA DEL USUARIO">
            <SubSection title="6.1 Principio Fundamental">
              <p className="font-bold uppercase">Clipealo es una herramienta. El usuario es responsable de cómo la usa.</p>
              <p>El usuario mantiene control total y responsabilidad absoluta sobre qué contenido decide transmitir, cómo utiliza los clips, dónde los publica y las consecuencias de su contenido.</p>
            </SubSection>
            <SubSection title="6.2 Responsabilidad Total del Usuario">
              <p>El usuario es única y exclusivamente responsable de su contenido original, los clips generados, las autorizaciones y permisos requeridos, los daños a terceros y todas las consecuencias legales derivadas de su contenido.</p>
            </SubSection>
            <SubSection title="6.3 Exoneración Total de Responsabilidad de Clipealo">
              <p>Clipealo NO es responsable, bajo ninguna circunstancia, de:</p>
              <ul>
                <li>Contenido que los usuarios transmiten, procesan o generan</li>
                <li>Uso, distribución o publicación de clips por usuarios</li>
                <li>Infracciones a derechos de autor, marcas o propiedad intelectual</li>
                <li>Violaciones a derechos de imagen, voz, privacidad o publicidad</li>
                <li>Contenido ilegal, difamatorio, obsceno o dañino generado por usuarios</li>
                <li>Reclamaciones, demandas o acciones legales de terceros contra usuarios</li>
                <li>Daños y perjuicios causados por contenido de usuarios</li>
                <li>Decisiones editoriales o de publicación de los usuarios</li>
                <li>Consecuencias penales, civiles o administrativas del contenido</li>
              </ul>
            </SubSection>
            <SubSection title="6.4 Clipealo como Intermediario Tecnológico">
              <p>Clipealo actúa exclusivamente como proveedor de infraestructura tecnológica, procesador técnico de datos y facilitador de herramientas automatizadas. NO actúa como editor de contenido, productor audiovisual, responsable editorial ni custodio de la legalidad del contenido.</p>
            </SubSection>
            <SubSection title="6.5 Declaraciones y Garantías del Usuario">
              <p>Al utilizar Clipealo, el usuario declara y garantiza que posee todos los derechos sobre el contenido procesado, ha obtenido los consentimientos requeridos, su contenido no infringe derechos de terceros, libera a Clipealo de toda responsabilidad y asume plena responsabilidad por daños a terceros.</p>
            </SubSection>
            <SubSection title="6.6 Obligación de Indemnizar">
              <p>El usuario se obliga irrevocablemente a <strong>defender</strong> a Clipealo ante reclamaciones relacionadas con su contenido, <strong>indemnizar</strong> todos los gastos, daños y perjuicios (incluyendo honorarios de abogados, costas procesales, indemnizaciones a terceros, daños reputacionales y pérdidas económicas) y <strong>mantener indemne</strong> a Clipealo, sus directores, empleados y representantes. Esta obligación subsiste tras la terminación de la cuenta.</p>
            </SubSection>
          </Section>

          <Section title="7. PROPIEDAD INTELECTUAL">
            <SubSection title="7.1 Derechos del Usuario sobre su Contenido">
              <p>El usuario retiene todos los derechos de propiedad intelectual sobre sus transmisiones, contenido original, clips generados y creaciones derivadas.</p>
            </SubSection>
            <SubSection title="7.2 Licencia Otorgada a Clipealo">
              <p>El usuario otorga a Clipealo una licencia limitada, no exclusiva, mundial y libre de regalías para procesar y analizar transmisiones mediante IA, generar clips automatizados, almacenar temporalmente el contenido y realizar operaciones técnicas requeridas. La licencia se mantiene durante la vigencia de la cuenta y finaliza 30 días después de su eliminación.</p>
              <p><strong>Importante:</strong> Esta licencia NO transfiere a Clipealo responsabilidad alguna sobre el contenido.</p>
            </SubSection>
            <SubSection title="7.3 Derechos de Clipealo">
              <p>Clipealo es titular exclusivo de la plataforma, código fuente, algoritmos de IA, modelos de aprendizaje automático, marca, logos, documentación, diseños, interfaces y mejoras tecnológicas, protegidos por el Decreto Legislativo N° 822.</p>
            </SubSection>
          </Section>

          <Section title="8. RECLAMACIONES POR INFRACCIONES A DERECHOS DE AUTOR">
            <SubSection title="8.1 Procedimiento de Notificación">
              <p>Envíe notificación a clipealoai@gmail.com incluyendo identificación del contenido protegido, identificación del material infractor, información de contacto completa, declaración de buena fe, declaración bajo juramento y firma.</p>
            </SubSection>
            <SubSection title="8.2 Medidas Adoptadas">
              <p>Al recibir una notificación válida, Clipealo evaluará la reclamación, suspenderá o eliminará el contenido infractor, suspenderá o dará de baja la cuenta del usuario y notificará al usuario afectado. Estas medidas no implican que Clipealo asuma responsabilidad por el contenido.</p>
            </SubSection>
            <SubSection title="8.3 Naturaleza del Procedimiento">
              <p>Clipealo opera un procedimiento simplificado. No se cuenta con un agente DMCA formal. Las decisiones se toman de buena fe y con criterio razonable.</p>
            </SubSection>
          </Section>

          <Section title="9. PLANES, PRECIOS Y FACTURACIÓN">
            <SubSection title="9.1 Modalidades de Servicio">
              <ul>
                <li><strong>Plan Gratuito:</strong> acceso limitado a funcionalidades básicas</li>
                <li><strong>Planes de Pago:</strong> acceso completo según el plan contratado</li>
              </ul>
            </SubSection>
            <SubSection title="9.2 Estructura de Precios">
              <ul>
                <li>Precios en Soles Peruanos (PEN) o Dólares Americanos (USD)</li>
                <li>Los precios publicados NO incluyen IGV</li>
                <li>El IGV (18%) se calcula y muestra al momento del pago</li>
                <li>Clipealo puede modificar precios con 30 días de anticipación</li>
              </ul>
            </SubSection>
            <SubSection title="9.3 Métodos de Pago">
              <p>Tarjetas de crédito y débito (Visa, Mastercard), transferencias bancarias y billeteras digitales según disponibilidad.</p>
            </SubSection>
            <SubSection title="9.4 Comprobantes de Pago">
              <p>Se emiten comprobantes electrónicos conforme a SUNAT: facturas electrónicas a personas jurídicas y boletas de venta electrónicas a personas naturales.</p>
            </SubSection>
            <SubSection title="9.5 Suscripciones y Renovación Automática">
              <p>Al contratar una suscripción autoriza cargos recurrentes según la periodicidad elegida. La renovación es automática. Puede cancelarla desde su cuenta y surte efecto al final del período vigente. No se otorgan reembolsos proporcionales por períodos no consumidos.</p>
            </SubSection>
          </Section>

          <Section title="10. POLÍTICA DE REEMBOLSOS">
            <SubSection title="10.1 Derecho de Retracto">
              <p>Reembolso disponible solo si: han transcurrido 7 días o menos desde la contratación <strong>Y</strong> el usuario no ha hecho uso alguno del servicio.</p>
            </SubSection>
            <SubSection title="10.2 Procedimiento">
              <p>Solicite reembolso enviando un correo a clipealoai@gmail.com.</p>
            </SubSection>
            <SubSection title="10.3 Exclusiones">
              <ul>
                <li>Más de 7 días desde la contratación</li>
                <li>El usuario ha utilizado el servicio, aunque sea parcialmente</li>
                <li>Cuenta suspendida por violación de términos</li>
                <li>Cambio de opinión después de usar el servicio</li>
                <li>Períodos de suscripción ya consumidos</li>
              </ul>
            </SubSection>
            <SubSection title="10.4 Excepciones">
              <p>Se evaluarán caso por caso: cargos duplicados o erróneos, fallas técnicas graves imputables a Clipealo y situaciones de fuerza mayor acreditadas.</p>
            </SubSection>
          </Section>

          <Section title="11. DISPONIBILIDAD Y FUNCIONAMIENTO DEL SERVICIO">
            <SubSection title="11.1 Nivel de Disponibilidad">
              <p>Clipealo se esfuerza por mantener una disponibilidad del 95% mensual. Pueden existir interrupciones por mantenimiento programado, actualizaciones de seguridad, fallas imprevistas o fuerza mayor.</p>
            </SubSection>
            <SubSection title="11.2 Ausencia de Garantías Absolutas">
              <p>Clipealo NO garantiza disponibilidad ininterrumpida 24/7/365, funcionamiento libre de errores, resultados perfectos en clips, compatibilidad universal ni conservación indefinida de contenido.</p>
            </SubSection>
            <SubSection title="11.3 Modificaciones al Servicio">
              <p>Clipealo puede agregar, modificar o eliminar funcionalidades, mejorar algoritmos, cambiar la interfaz y descontinuar características obsoletas. Las modificaciones sustanciales se notificarán con anticipación razonable.</p>
            </SubSection>
          </Section>

          <Section title="12. LIMITACIÓN Y EXONERACIÓN DE RESPONSABILIDAD">
            <SubSection title="12.1 Exoneración Total">
              <p className="uppercase font-semibold">En el máximo permitido por la ley peruana, Clipealo no asume responsabilidad alguna por:</p>
              <p><strong>a) Contenido de Usuarios:</strong> contenido creado o procesado, clips generados, uso o publicación, infracciones, daños a terceros y consecuencias legales.</p>
              <p><strong>b) Plataformas de Terceros:</strong> funcionamiento de Twitch/YouTube/etc., cambios en sus políticas, suspensiones de cuentas, eliminación de contenido y problemas de integración.</p>
              <p><strong>c) Daños y Perjuicios:</strong> pérdida de ingresos o audiencia, daños reputacionales, oportunidades comerciales, daños indirectos, lucro cesante y pérdida de datos (salvo dolo o negligencia grave).</p>
              <p><strong>d) Interrupciones:</strong> downtime, pérdidas por no disponibilidad, errores o bugs, resultados insatisfactorios de la IA.</p>
              <p><strong>e) Acciones de Terceros:</strong> reclamaciones, decisiones judiciales, sanciones o conflictos contra usuarios.</p>
            </SubSection>
            <SubSection title='12.2 Servicio "TAL CUAL"'>
              <p>Clipealo proporciona el servicio "AS IS" y "AS AVAILABLE", sin garantías expresas o implícitas de comerciabilidad, idoneidad para un propósito particular, no infracción, exactitud, disponibilidad ininterrumpida o ausencia de errores.</p>
            </SubSection>
            <SubSection title="12.3 Naturaleza del Servicio Automatizado">
              <p>El usuario reconoce que Clipealo utiliza IA, los resultados son automáticos, la calidad depende de múltiples variables, los algoritmos pueden cometer errores y Clipealo no revisa ni edita el contenido procesado.</p>
            </SubSection>
            <SubSection title="12.4 Limitación Cuantitativa Residual">
              <p>En el improbable caso de indemnización, la responsabilidad máxima de Clipealo se limita a lo efectivamente pagado por el usuario en los 3 meses previos a la reclamación. No aplica al dolo, culpa inexcusable, lesiones por negligencia grave ni responsabilidades que la ley prohíba limitar.</p>
            </SubSection>
            <SubSection title="12.5 Fuerza Mayor">
              <p>Clipealo no será responsable por incumplimientos por desastres naturales, actos de gobierno, cortes de servicios, ataques cibernéticos, pandemias, conflictos armados o fallas de proveedores críticos.</p>
            </SubSection>
            <SubSection title="12.6 Reconocimiento del Usuario">
              <p>Al aceptar estos términos, el usuario reconoce que ha leído estas limitaciones, acepta que Clipealo es solo una herramienta, asume todos los riesgos, no esperará que Clipealo responda por su contenido y conoce que podría enfrentar reclamaciones de terceros.</p>
            </SubSection>
          </Section>

          <Section title="13. SUSPENSIÓN Y TERMINACIÓN">
            <SubSection title="13.1 Terminación por el Usuario">
              <p>Puede cancelar su cuenta desde la configuración o por correo a clipealoai@gmail.com. La cancelación es efectiva al finalizar el período de facturación vigente.</p>
            </SubSection>
            <SubSection title="13.2 Terminación por Clipealo">
              <p>Clipealo puede suspender o terminar una cuenta sin previo aviso por:</p>
              <ul>
                <li>Violación de estos Términos</li>
                <li>Actividad fraudulenta o ilícita</li>
                <li>Falta de pago</li>
                <li>Uso que comprometa seguridad o estabilidad</li>
                <li>Reclamaciones graves de terceros</li>
                <li>Inactividad prolongada (más de 12 meses)</li>
                <li>Orden judicial o administrativa</li>
              </ul>
            </SubSection>
            <SubSection title="13.3 Efectos de la Terminación">
              <ul>
                <li>Pérdida de acceso inmediato a los Servicios</li>
                <li>Plazo de 30 días para descargar contenido personal</li>
                <li>Eliminación posterior del contenido almacenado</li>
                <li>No proceden reembolsos por servicios ya prestados</li>
                <li>Subsisten las obligaciones de pago e indemnización</li>
              </ul>
            </SubSection>
            <SubSection title="13.4 Supervivencia de Cláusulas">
              <p>Permanecen vigentes tras la terminación las obligaciones de pago, responsabilidad por contenido, indemnización, limitaciones, licencias sobre contenido procesado, confidencialidad, propiedad intelectual y disposiciones sobre resolución de controversias.</p>
            </SubSection>
          </Section>

          <Section title="14. LEY APLICABLE Y RESOLUCIÓN DE CONTROVERSIAS">
            <SubSection title="14.1 Legislación Aplicable">
              <ul>
                <li>Código Civil Peruano</li>
                <li>Código de Protección y Defensa del Consumidor (Ley N° 29571)</li>
                <li>Ley de Protección de Datos Personales (Ley N° 29733)</li>
                <li>Ley de Delitos Informáticos (Ley N° 30096)</li>
                <li>Decreto Legislativo N° 822 - Ley sobre el Derecho de Autor</li>
              </ul>
            </SubSection>
            <SubSection title="14.2 Solución Extrajudicial">
              <p>Las partes intentarán resolver la controversia mediante negociación directa, comunicación de buena fe y mecanismos alternativos antes de iniciar acciones legales.</p>
            </SubSection>
            <SubSection title="14.3 Competencia Jurisdiccional">
              <p><strong>Consumidores:</strong> pueden reclamar ante INDECOPI, juzgados de su domicilio o arbitraje de consumo.</p>
              <p><strong>Empresariales:</strong> juzgados de Lima, Perú; pueden acordar arbitraje mediante convenio expreso.</p>
            </SubSection>
            <SubSection title="14.4 Libro de Reclamaciones">
              <p>Clipealo pone a disposición libro de reclamaciones virtual y atención por correo a clipealoai@gmail.com con plazo de respuesta de 30 días calendario. Los reclamos pueden presentarse ante INDECOPI (www.indecopi.gob.pe).</p>
            </SubSection>
            <SubSection title="14.5 Prescripción de Acciones">
              <p>Toda acción derivada de estos Términos prescribe a los dos años, conforme al artículo 2001 del Código Civil Peruano.</p>
            </SubSection>
          </Section>

          <Section title="15. DISPOSICIONES GENERALES">
            <SubSection title="15.1 Integridad del Acuerdo">
              <p>Estos Términos, junto con la Política de Privacidad, constituyen el acuerdo completo entre el usuario y Clipealo, reemplazando cualquier acuerdo previo.</p>
            </SubSection>
            <SubSection title="15.2 Divisibilidad">
              <p>Si alguna disposición fuera declarada inválida, las demás permanecerán en pleno vigor y efecto.</p>
            </SubSection>
            <SubSection title="15.3 Renuncia">
              <p>El no ejercicio de cualquier derecho no constituye renuncia ni impide su ejercicio posterior.</p>
            </SubSection>
            <SubSection title="15.4 Cesión">
              <p>El usuario no puede ceder sus derechos sin consentimiento previo y escrito de Clipealo. Clipealo puede ceder libremente estos términos a entidades afiliadas, sucesoras o adquirentes.</p>
            </SubSection>
            <SubSection title="15.5 Notificaciones">
              <p>A Clipealo: clipealoai@gmail.com. Al usuario: al correo registrado. Las notificaciones se consideran recibidas 24 horas después del envío.</p>
            </SubSection>
            <SubSection title="15.6 Idioma">
              <p>Estos Términos se redactan y ejecutan en español. Las traducciones son únicamente referenciales.</p>
            </SubSection>
            <SubSection title="15.7 Independencia de las Partes">
              <p>La relación es de prestador de servicios independiente. No se crea relación laboral, asociación, joint venture, agencia ni sociedad.</p>
            </SubSection>
            <SubSection title="15.8 Obligaciones Tributarias">
              <p>El usuario es responsable de declarar ingresos generados, pagar los impuestos correspondientes ante SUNAT, cumplir todas las obligaciones tributarias y realizar retenciones cuando corresponda.</p>
            </SubSection>
            <SubSection title="15.9 Modificaciones a los Términos">
              <p>Clipealo puede modificar estos Términos en cualquier momento, notificando vía plataforma y correo. El usuario tendrá 30 días para aceptar o cancelar su cuenta. El uso continuado constituye aceptación.</p>
            </SubSection>
          </Section>

          <Section title="16. ACEPTACIÓN Y CONSENTIMIENTO INFORMADO">
            <p>Al crear una cuenta, acceder a la plataforma o utilizar los Servicios de Clipealo, el usuario declara y acepta expresamente que:</p>
            <ul>
              <li>Ha leído íntegramente estos Términos y Condiciones</li>
              <li>Comprende que Clipealo es únicamente una herramienta tecnológica</li>
              <li>Acepta ser el único responsable de su contenido y del uso de los clips</li>
              <li>Reconoce que Clipealo no tiene responsabilidad por su contenido</li>
              <li>Entiende que podría enfrentar reclamaciones de terceros</li>
              <li>Acepta defender e indemnizar a Clipealo ante cualquier reclamación</li>
              <li>Renuncia a reclamar a Clipealo por consecuencias de su propio contenido</li>
              <li>Posee capacidad legal para contratar conforme a las leyes peruanas</li>
              <li>Consiente el tratamiento de sus datos según la Política de Privacidad</li>
            </ul>
            <p className="text-muted-foreground text-sm mt-6">
              Contacto: clipealoai@gmail.com · Discord disponible en la plataforma<br />
              Última actualización: 8 de febrero de 2026 · Versión 1.0<br />
              Clipealo - Herramienta de generación automatizada de clips
            </p>
          </Section>

          <Section title="ANEXO - DEFINICIONES">
            <ul>
              <li><strong>Clipealo:</strong> la plataforma tecnológica, el servicio y la herramienta prestada.</li>
              <li><strong>Clip:</strong> segmento de video corto generado automáticamente por IA.</li>
              <li><strong>Contenido:</strong> material de audio, video, texto, imágenes u otro formato proporcionado por el usuario.</li>
              <li><strong>Cuenta:</strong> perfil de usuario con credenciales únicas de acceso.</li>
              <li><strong>IA / Inteligencia Artificial:</strong> tecnología de aprendizaje automático que analiza transmisiones.</li>
              <li><strong>Plataforma de Streaming:</strong> servicios de terceros como Twitch, YouTube, Facebook Gaming.</li>
              <li><strong>Servicios:</strong> todas las funcionalidades y prestaciones ofrecidas por Clipealo.</li>
              <li><strong>Streamer:</strong> creador de contenido que realiza transmisiones en vivo o grabadas.</li>
              <li><strong>Transmisión / Stream:</strong> video en vivo o grabado del que se generan clips.</li>
              <li><strong>Usuario:</strong> persona natural o jurídica que utiliza los Servicios de Clipealo.</li>
            </ul>
          </Section>
        </div>
      </article>

      <Footer />
    </main>
  );
};

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="space-y-4">
    <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground border-l-4 border-primary pl-4">
      {title}
    </h2>
    <div className="space-y-4 text-foreground/80 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-1.5 [&_a]:text-primary">
      {children}
    </div>
  </section>
);

const SubSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="space-y-2 mt-6">
    <h3 className="font-display text-lg sm:text-xl font-semibold text-foreground/95">
      {title}
    </h3>
    <div className="space-y-2 text-foreground/75">
      {children}
    </div>
  </div>
);

export default TermsPage;