import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SEOHead from '@/components/SEOHead';

const PrivacyPolicyPage = () => {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <SEOHead
        title="Política de Privacidad"
        description="Política de Privacidad de Clipealo. Conoce cómo recopilamos, usamos y protegemos tus datos personales conforme a la Ley N° 29733 del Perú."
        canonicalPath="/politica-de-privacidad"
      />
      <Header />

      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-24">
        <header className="mb-12 border-b border-border pb-8">
          <h1 className="font-display text-4xl sm:text-5xl font-bold mb-4 text-foreground">
            Política de Privacidad
          </h1>
          <p className="text-muted-foreground text-sm">
            Fecha de entrada en vigor: 8 de febrero de 2026 · Versión 1.0
          </p>
        </header>

        <div className="prose-legal space-y-10 text-foreground/90 leading-relaxed">
          <Section title="1. INTRODUCCIÓN">
            <p>
              Esta es la Política de Privacidad de <strong>Clipealo</strong>, una plataforma de generación automatizada de clips para streamers operada en Perú. Esta política explica cómo recopilamos, usamos, almacenamos y protegemos sus datos personales cuando utiliza nuestros servicios.
            </p>
            <p>
              Al utilizar Clipealo, usted acepta las prácticas descritas en esta Política de Privacidad. Si no está de acuerdo, no utilice nuestros servicios.
            </p>
            <SubSection title="1.1 Marco Legal">
              <p>Esta Política de Privacidad cumple con:</p>
              <ul>
                <li>Ley N° 29733 - Ley de Protección de Datos Personales del Perú</li>
                <li>Decreto Supremo N° 003-2013-JUS (Reglamento de la Ley N° 29733)</li>
                <li>Directivas de la Autoridad Nacional de Protección de Datos Personales</li>
              </ul>
            </SubSection>
            <SubSection title="1.2 Relación con los Términos de Servicio">
              <p>
                Esta Política de Privacidad es parte integral de nuestros Términos y Condiciones de Servicio. Los términos utilizados aquí tienen el mismo significado que en los Términos de Servicio, salvo que se indique lo contrario.
              </p>
            </SubSection>
            <SubSection title="1.3 Proveedor del Servicio">
              <p>
                <strong>Responsable del Tratamiento:</strong> [Razón social - a definir]<br />
                <strong>RUC:</strong> [a definir]<br />
                <strong>Domicilio:</strong> [Dirección en Lima, Perú - a definir]<br />
                <strong>Correo electrónico:</strong> clipealoai@gmail.com
              </p>
            </SubSection>
            <SubSection title="1.4 Modificaciones">
              <p>Podemos modificar esta Política de Privacidad ocasionalmente. Le notificaremos mediante:</p>
              <ul>
                <li>Aviso en la plataforma</li>
                <li>Correo electrónico a su dirección registrada</li>
                <li>Actualización de la fecha de vigencia</li>
              </ul>
              <p>El uso continuado de los servicios después de las modificaciones constituye su aceptación de los cambios.</p>
            </SubSection>
          </Section>

          <Section title="2. ALCANCE DE ESTA POLÍTICA">
            <SubSection title="2.1 Qué Cubre">
              <p>Esta política describe cómo tratamos los datos personales que recopilamos cuando:</p>
              <ul>
                <li>Crea una cuenta en Clipealo</li>
                <li>Utiliza nuestros servicios de generación de clips</li>
                <li>Navega por nuestra plataforma</li>
                <li>Se comunica con nosotros</li>
              </ul>
            </SubSection>
            <SubSection title="2.2 Definición de Datos Personales">
              <p>"Datos Personales" significa cualquier información que identifica o hace identificable a una persona natural, incluyendo:</p>
              <ul>
                <li>Nombre y apellidos</li>
                <li>Correo electrónico</li>
                <li>Número de teléfono</li>
                <li>Dirección IP</li>
                <li>Información de dispositivos</li>
                <li>Cualquier otra información que permita identificarlo</li>
              </ul>
            </SubSection>
            <SubSection title="2.3 Qué No Cubre">
              <p>Esta política NO cubre:</p>
              <ul>
                <li>Prácticas de sitios web o servicios de terceros</li>
                <li>Plataformas de streaming (Twitch, YouTube, etc.)</li>
                <li>Servicios de pago de terceros</li>
                <li>Enlaces externos</li>
              </ul>
            </SubSection>
          </Section>

          <Section title="3. DATOS PERSONALES QUE RECOPILAMOS">
            <SubSection title="3.1 Datos que Usted Proporciona Directamente">
              <p><strong>a) Información de Cuenta:</strong> nombre y apellidos, correo electrónico, contraseña (encriptada), nombre de usuario, número de teléfono (si lo proporciona).</p>
              <p><strong>b) Información de Pago:</strong> procesada por terceros (Stripe u otros). No almacenamos datos completos de tarjetas. Conservamos únicamente registros de transacciones necesarios.</p>
              <p><strong>c) Credenciales de Plataformas de Streaming:</strong> tokens de acceso a Twitch, YouTube, Facebook Gaming, etc.; nombres de usuario; datos necesarios para la integración autorizada.</p>
              <p><strong>d) Contenido que Procesa:</strong> URLs de transmisiones, clips generados, configuraciones de edición, preferencias de procesamiento.</p>
              <p><strong>e) Comunicaciones:</strong> mensajes a soporte, retroalimentación, reportes de problemas.</p>
            </SubSection>
            <SubSection title="3.2 Datos que Recopilamos Automáticamente">
              <p><strong>a) Información Técnica:</strong> IP, navegador, sistema operativo, tipo de dispositivo, resolución, idioma.</p>
              <p><strong>b) Datos de Uso:</strong> páginas visitadas, tiempo de permanencia, funcionalidades utilizadas, frecuencia, patrones de navegación, errores.</p>
              <p><strong>c) Cookies y Tecnologías Similares:</strong> cookies de sesión, preferencias, analíticas, identificadores únicos.</p>
              <p><strong>d) Datos de Geolocalización:</strong> ubicación aproximada por IP, zona horaria.</p>
            </SubSection>
            <SubSection title="3.3 Datos de Plataformas de Terceros">
              <p>Cuando autoriza la integración con plataformas de streaming: información pública del perfil, lista de transmisiones, estadísticas públicas, metadatos.</p>
              <p><strong>Importante:</strong> Solo accedemos a datos que usted autoriza expresamente mediante OAuth de cada plataforma.</p>
            </SubSection>
            <SubSection title="3.4 Datos que NO Recopilamos Intencionalmente">
              <ul>
                <li>Datos de menores de 18 años sin consentimiento parental</li>
                <li>Categorías especiales de datos (origen racial, étnico, opiniones políticas, religiosas, salud, orientación sexual, biométricos)</li>
                <li>Números completos de tarjetas de crédito o débito</li>
                <li>Contraseñas de plataformas de terceros</li>
              </ul>
              <p>Si inadvertidamente recibimos estos datos, los eliminamos inmediatamente.</p>
            </SubSection>
          </Section>

          <Section title="4. FINALIDADES DEL TRATAMIENTO DE DATOS">
            <SubSection title="4.1 Prestación del Servicio">
              <ul>
                <li>Crear y gestionar su cuenta</li>
                <li>Autenticar su identidad al iniciar sesión</li>
                <li>Procesar sus transmisiones con nuestra IA</li>
                <li>Generar clips automáticamente</li>
                <li>Almacenar y gestionar su contenido</li>
                <li>Proporcionar funcionalidades de edición</li>
                <li>Facilitar la distribución de clips</li>
                <li>Procesar pagos y suscripciones</li>
              </ul>
            </SubSection>
            <SubSection title="4.2 Comunicación con el Usuario">
              <ul>
                <li>Confirmaciones de cuenta</li>
                <li>Estado de procesamiento</li>
                <li>Soporte y respuestas a consultas</li>
                <li>Cambios en el servicio</li>
                <li>Actualizaciones de seguridad</li>
              </ul>
            </SubSection>
            <SubSection title="4.3 Mejora del Servicio">
              <ul>
                <li>Analizar patrones de uso</li>
                <li>Identificar y corregir errores técnicos</li>
                <li>Mejorar algoritmos de IA</li>
                <li>Desarrollar nuevas funcionalidades</li>
                <li>Realizar pruebas y análisis internos</li>
              </ul>
            </SubSection>
            <SubSection title="4.4 Seguridad y Prevención de Fraude">
              <ul>
                <li>Detectar actividades sospechosas</li>
                <li>Prevenir accesos no autorizados</li>
                <li>Identificar intentos de fraude</li>
                <li>Proteger la integridad de la plataforma</li>
                <li>Cumplir con obligaciones de seguridad</li>
              </ul>
            </SubSection>
            <SubSection title="4.5 Marketing (Con Su Consentimiento)">
              <ul>
                <li>Newsletters sobre actualizaciones</li>
                <li>Nuevas funcionalidades</li>
                <li>Contenido educativo para streamers</li>
                <li>Ofertas promocionales</li>
              </ul>
              <p>Puede darse de baja en cualquier momento.</p>
            </SubSection>
            <SubSection title="4.6 Cumplimiento Legal">
              <ul>
                <li>Cumplir obligaciones legales y regulatorias</li>
                <li>Responder a requerimientos de autoridades</li>
                <li>Defender nuestros derechos legales</li>
                <li>Hacer cumplir nuestros Términos de Servicio</li>
              </ul>
            </SubSection>
            <SubSection title="4.7 Base Legal (Ley N° 29733)">
              <ul>
                <li><strong>Consentimiento:</strong> al crear su cuenta y aceptar esta política</li>
                <li><strong>Ejecución contractual:</strong> para prestar los servicios contratados</li>
                <li><strong>Interés legítimo:</strong> mejorar el servicio y garantizar seguridad</li>
                <li><strong>Obligación legal:</strong> cumplir normativa aplicable</li>
              </ul>
            </SubSection>
          </Section>

          <Section title="5. CÓMO COMPARTIMOS SUS DATOS">
            <SubSection title="5.1 Principio General">
              <p><strong>No vendemos sus datos personales a terceros.</strong> Solo compartimos información en las circunstancias específicas descritas a continuación.</p>
            </SubSection>
            <SubSection title="5.2 Proveedores de Servicios">
              <p>Compartimos datos con proveedores que nos ayudan a operar:</p>
              <ul>
                <li><strong>Infraestructura y Hosting:</strong> servidores en la nube, almacenamiento, procesamiento de IA</li>
                <li><strong>Procesamiento de Pagos:</strong> Stripe u otros procesadores autorizados</li>
                <li><strong>Comunicación:</strong> proveedores de correo transaccional, notificaciones</li>
                <li><strong>Análisis y Monitoreo:</strong> Google Analytics u herramientas similares</li>
                <li><strong>Soporte Técnico:</strong> plataformas de atención al cliente, sistemas de tickets</li>
              </ul>
              <p>Todos los proveedores están obligados contractualmente a proteger sus datos, solo pueden usarlos para los fines autorizados y cumplen con estándares de seguridad adecuados.</p>
            </SubSection>
            <SubSection title="5.3 Plataformas de Streaming">
              <p>Cuando autoriza la integración accedemos a sus datos mediante APIs oficiales, solo en el alcance autorizado, y podemos publicar clips en su nombre si lo permite, sujeto a los términos de cada plataforma.</p>
            </SubSection>
            <SubSection title="5.4 Requisitos Legales">
              <p>Podemos divulgar datos cuando lo exija una orden judicial, autoridad competente (Fiscalía, Policía), para defender derechos legales, prevenir fraude o proteger la seguridad de usuarios o terceros.</p>
            </SubSection>
            <SubSection title="5.5 Transferencias Empresariales">
              <p>En caso de fusión, adquisición o venta de activos, sus datos pueden transferirse al adquirente. Le notificaremos con anticipación y podrá eliminar su cuenta antes de la transferencia.</p>
            </SubSection>
            <SubSection title="5.6 Con Su Consentimiento">
              <p>Podemos compartir datos con terceros adicionales cuando usted nos autorice expresamente, configure integraciones específicas o utilice funcionalidades que lo requieran.</p>
            </SubSection>
            <SubSection title="5.7 Datos Agregados y Anonimizados">
              <p>Podemos compartir información agregada o anonimizada que no identifique a individuos para estadísticas o investigación.</p>
            </SubSection>
          </Section>

          <Section title="6. COOKIES Y TECNOLOGÍAS SIMILARES">
            <SubSection title="6.1 Qué son las Cookies">
              <p>Las cookies son pequeños archivos de texto que se almacenan en su dispositivo cuando visita nuestra plataforma. Nos ayudan a reconocer su navegador y recordar preferencias.</p>
            </SubSection>
            <SubSection title="6.2 Tipos de Cookies que Utilizamos">
              <p><strong>a) Esenciales (siempre activas):</strong> sesión, configuración de cuenta, funcionalidades básicas.</p>
              <p><strong>b) Funcionalidad:</strong> idioma, zona horaria, configuraciones personalizadas.</p>
              <p><strong>c) Analíticas:</strong> uso de la plataforma, problemas técnicos, generalmente vía Google Analytics.</p>
              <p><strong>d) Marketing (requieren consentimiento):</strong> efectividad de campañas, personalización, conversiones.</p>
            </SubSection>
            <SubSection title="6.3 Gestión de Cookies">
              <p>Puede controlar las cookies desde la configuración de su navegador o desde el panel de configuración de cookies de la plataforma. Bloquear cookies esenciales puede impedir el funcionamiento correcto del servicio.</p>
            </SubSection>
            <SubSection title="6.4 Tecnologías Similares">
              <p>También utilizamos web beacons, local storage e identificadores de dispositivo.</p>
            </SubSection>
            <SubSection title="6.5 Cookies de Terceros">
              <p>Algunas cookies son colocadas por Google Analytics, procesadores de pago o redes publicitarias. Estos terceros tienen sus propias políticas de privacidad.</p>
            </SubSection>
          </Section>

          <Section title="7. RETENCIÓN DE DATOS">
            <SubSection title="7.1 Criterios de Retención">
              <p>Conservamos sus datos mientras mantenga una cuenta activa, sea necesario para prestar los servicios, lo requieran obligaciones legales o existan reclamaciones legales pendientes.</p>
            </SubSection>
            <SubSection title="7.2 Períodos Específicos">
              <ul>
                <li><strong>Datos de cuenta:</strong> durante la vigencia + 30 días tras eliminación</li>
                <li><strong>Transacciones:</strong> 5 años (normativa tributaria peruana)</li>
                <li><strong>Comunicaciones:</strong> 2 años desde la última interacción</li>
                <li><strong>Datos técnicos (logs, IP):</strong> 12 meses</li>
                <li><strong>Contenido procesado:</strong> mientras la cuenta esté activa + 30 días</li>
                <li><strong>Cookies:</strong> de sesión hasta 24 meses</li>
              </ul>
            </SubSection>
            <SubSection title="7.3 Eliminación Segura">
              <p>Utilizamos procesos de borrado seguro. Los respaldos se eliminan en ciclos regulares. Conservamos únicamente datos anonimizados para estadísticas.</p>
            </SubSection>
            <SubSection title="7.4 Excepciones">
              <p>Podemos conservar datos por más tiempo cuando lo exija una orden judicial, sea necesario para procedimientos legales o auditorías regulatorias.</p>
            </SubSection>
          </Section>

          <Section title="8. SEGURIDAD DE LA INFORMACIÓN">
            <SubSection title="8.1 Compromiso con la Seguridad">
              <p>Implementamos medidas técnicas, organizativas y administrativas para proteger sus datos contra acceso no autorizado, pérdida, destrucción, divulgación indebida o uso no autorizado.</p>
            </SubSection>
            <SubSection title="8.2 Medidas Técnicas">
              <p><strong>Encriptación:</strong> HTTPS/TLS, hashing con salt para contraseñas, encriptación de datos sensibles en reposo.</p>
              <p><strong>Control de Acceso:</strong> 2FA cuando esté disponible, gestión de permisos por roles, logs de auditoría.</p>
              <p><strong>Protección de Infraestructura:</strong> firewalls, IDS, actualizaciones regulares, monitoreo continuo, respaldos.</p>
              <p><strong>Seguridad en el Desarrollo:</strong> revisión de código, pruebas de seguridad, gestión de vulnerabilidades.</p>
            </SubSection>
            <SubSection title="8.3 Medidas Organizativas">
              <ul>
                <li>Políticas de seguridad de la información</li>
                <li>Capacitación del personal</li>
                <li>Acuerdos de confidencialidad</li>
                <li>Procedimientos de respuesta a incidentes</li>
              </ul>
            </SubSection>
            <SubSection title="8.4 Sus Responsabilidades">
              <ul>
                <li>Elija contraseñas seguras y únicas</li>
                <li>No comparta sus credenciales</li>
                <li>Cierre sesión en dispositivos compartidos</li>
                <li>Mantenga actualizado su software</li>
                <li>Reporte actividad sospechosa inmediatamente</li>
              </ul>
            </SubSection>
            <SubSection title="8.5 Limitaciones">
              <p>Ningún sistema es 100% seguro. Si detectamos una brecha que afecte sus datos, le notificaremos conforme a la ley peruana.</p>
            </SubSection>
          </Section>

          <Section title="9. SUS DERECHOS BAJO LA LEY PERUANA">
            <SubSection title="9.1 Derechos Reconocidos (Ley N° 29733)">
              <ul>
                <li><strong>Acceso:</strong> conocer qué datos conservamos y cómo los usamos</li>
                <li><strong>Rectificación:</strong> corregir datos inexactos o desactualizados</li>
                <li><strong>Cancelación:</strong> solicitar eliminación de sus datos</li>
                <li><strong>Oposición:</strong> oponerse al tratamiento, en especial para marketing</li>
                <li><strong>Información:</strong> conocer finalidades y destinatarios</li>
                <li><strong>Retirar consentimiento:</strong> en cualquier momento, sin efecto retroactivo</li>
                <li><strong>No ser objeto de decisiones automatizadas:</strong> con efectos jurídicos o similares</li>
              </ul>
            </SubSection>
            <SubSection title="9.2 Cómo Ejercer Sus Derechos">
              <p><strong>Paso 1:</strong> envíe su solicitud a clipealoai@gmail.com incluyendo derecho a ejercer, datos de contacto, copia de DNI y descripción específica.</p>
              <p><strong>Paso 2:</strong> verificación de identidad.</p>
              <p><strong>Paso 3:</strong> respondemos en 10 días hábiles para información y 20 días hábiles para acceso, rectificación, cancelación u oposición. Plazo extensible 10 días adicionales.</p>
              <p><strong>Paso 4:</strong> resolución. No cobramos por ejercer sus derechos.</p>
            </SubSection>
            <SubSection title="9.3 Limitaciones y Excepciones">
              <p>Podemos denegar o limitar derechos cuando exista obligación legal, sea necesario para contratos, defensa legal o afecte derechos de terceros. Le informaremos del motivo.</p>
            </SubSection>
            <SubSection title="9.4 Recurso ante la Autoridad">
              <p>
                Puede presentar queja ante la <strong>Autoridad Nacional de Protección de Datos Personales</strong>, Ministerio de Justicia y Derechos Humanos.<br />
                Correo: protecciondedatos@minjus.gob.pe — Web: www.minjus.gob.pe
              </p>
            </SubSection>
          </Section>

          <Section title="10. PRIVACIDAD DE MENORES">
            <SubSection title="10.1 Edad Mínima">
              <p>Nuestros servicios están dirigidos a personas mayores de 18 años. No recopilamos intencionalmente datos de menores sin consentimiento parental.</p>
            </SubSection>
            <SubSection title="10.2 Consentimiento Parental">
              <p>Si un menor desea usar los servicios requiere autorización expresa de padres o tutores, quienes son responsables del uso y deben supervisar la actividad.</p>
            </SubSection>
            <SubSection title="10.3 Descubrimiento de Datos de Menores">
              <p>Si descubrimos que hemos recopilado datos de un menor sin consentimiento apropiado, los eliminaremos inmediatamente, suspenderemos la cuenta y notificaremos si es posible.</p>
            </SubSection>
            <SubSection title="10.4 Aviso a Padres y Tutores">
              <p>Si cree que un menor ha proporcionado datos sin autorización, contáctenos a clipealoai@gmail.com.</p>
            </SubSection>
          </Section>

          <Section title="11. TRANSFERENCIAS INTERNACIONALES DE DATOS">
            <SubSection title="11.1 Ubicación de Servidores">
              <p>Nuestros servidores pueden estar ubicados en Estados Unidos u otros países fuera de Perú.</p>
            </SubSection>
            <SubSection title="11.2 Protección en Transferencias">
              <p>Utilizamos proveedores con medidas adecuadas, cláusulas contractuales de protección y verificamos nivel adecuado de protección en el país destino, conforme a la Ley N° 29733.</p>
            </SubSection>
            <SubSection title="11.3 Proveedores en el Extranjero">
              <p>Servicios como Google Cloud, AWS, Stripe o Google Analytics pueden tener servidores internacionales y cumplen sus propios estándares de seguridad y privacidad.</p>
            </SubSection>
            <SubSection title="11.4 Su Consentimiento">
              <p>Al aceptar esta Política, consiente expresamente la transferencia internacional de sus datos bajo las condiciones descritas.</p>
            </SubSection>
          </Section>

          <Section title="12. COMUNICACIONES DE MARKETING">
            <SubSection title="12.1 Tipos de Comunicaciones">
              <ul>
                <li>Newsletters sobre el servicio</li>
                <li>Actualizaciones de producto</li>
                <li>Consejos para streamers</li>
                <li>Ofertas promocionales</li>
                <li>Encuestas de satisfacción</li>
              </ul>
            </SubSection>
            <SubSection title="12.2 Base Legal">
              <p>Solo enviamos marketing cuando ha dado su consentimiento o tiene relación contractual con nosotros (servicios relacionados).</p>
            </SubSection>
            <SubSection title="12.3 Cómo Darse de Baja">
              <p>Puede cancelar la suscripción haciendo clic en "darse de baja" en cualquier correo, desde la configuración de su cuenta o por email a clipealoai@gmail.com. Seguirá recibiendo comunicaciones transaccionales y avisos de seguridad.</p>
            </SubSection>
          </Section>

          <Section title="13. INTEGRACIONES CON PLATAFORMAS DE TERCEROS">
            <SubSection title="13.1 Conexión con Plataformas de Streaming">
              <p><strong>Autorización OAuth:</strong> sistemas seguros, accedemos solo a lo que permite, puede revocar acceso en cualquier momento.</p>
              <p><strong>Datos accedidos:</strong> perfil público, lista de transmisiones, metadatos y estadísticas públicas.</p>
              <p><strong>Credenciales:</strong> tokens almacenados de forma segura. No almacenamos sus contraseñas de esas plataformas.</p>
            </SubSection>
            <SubSection title="13.2 Publicación Autorizada">
              <p>Si autoriza que publiquemos clips en su nombre, lo haremos solo cuando lo indique, mediante APIs oficiales, y podrá revocar el permiso cuando lo desee.</p>
            </SubSection>
            <SubSection title="13.3 Responsabilidad">
              <p>Cada plataforma tiene sus propias políticas. Revise los términos de Twitch, YouTube, etc. No somos responsables de sus prácticas de privacidad.</p>
            </SubSection>
            <SubSection title="13.4 Desconexión">
              <p>Puede desconectar integraciones desde la configuración de su cuenta en Clipealo o desde la plataforma original. Al desconectar, dejamos de acceder a esos datos.</p>
            </SubSection>
          </Section>

          <Section title="14. CAMBIOS A ESTA POLÍTICA">
            <SubSection title="14.1 Derecho a Modificar">
              <p>Podemos modificar esta Política para cumplir nuevas regulaciones, reflejar cambios en servicios, mejorar la protección de datos o actualizar prácticas.</p>
            </SubSection>
            <SubSection title="14.2 Notificación de Cambios">
              <p>Notificaremos cambios significativos mediante aviso destacado en la plataforma, correo electrónico y actualización de la fecha de vigencia.</p>
            </SubSection>
            <SubSection title="14.3 Aceptación de Cambios">
              <p>Tiene 30 días para revisar los cambios. Puede rechazarlos cancelando su cuenta. El uso continuado implica aceptación.</p>
            </SubSection>
            <SubSection title="14.4 Cambios Menores">
              <p>Para correcciones o clarificaciones, actualizaremos la política directamente e indicaremos la nueva fecha de vigencia.</p>
            </SubSection>
          </Section>

          <Section title="15. DATOS DE CONTACTO">
            <SubSection title="15.1 Consultas Generales">
              <p>Correo: <a className="text-primary hover:underline" href="mailto:clipealoai@gmail.com">clipealoai@gmail.com</a> · Asunto: "Privacidad - [breve descripción]"</p>
            </SubSection>
            <SubSection title="15.2 Ejercicio de Derechos">
              <p>Correo: clipealoai@gmail.com · Asunto: "Solicitud de Derechos ARCO - [tipo de derecho]"</p>
            </SubSection>
            <SubSection title="15.3 Reportar Incidentes de Seguridad">
              <p>Correo: clipealoai@gmail.com · Asunto: "URGENTE - Incidente de Seguridad"</p>
            </SubSection>
            <SubSection title="15.4 Quejas y Reclamos">
              <p>Primera instancia: clipealoai@gmail.com. Autoridad competente: Autoridad Nacional de Protección de Datos Personales — protecciondedatos@minjus.gob.pe</p>
            </SubSection>
            <SubSection title="15.5 Tiempos de Respuesta">
              <ul>
                <li>Consultas generales: 5 días hábiles</li>
                <li>Solicitudes de derechos: 10-20 días hábiles</li>
                <li>Incidentes de seguridad: inmediato</li>
              </ul>
            </SubSection>
          </Section>

          <Section title="16. DISPOSICIONES FINALES">
            <SubSection title="16.1 Idioma">
              <p>Esta Política está redactada en español. Es la única versión válida.</p>
            </SubSection>
            <SubSection title="16.2 Divisibilidad">
              <p>Si alguna disposición es inválida, las demás permanecen vigentes.</p>
            </SubSection>
            <SubSection title="16.3 Ley Aplicable">
              <p>Se rige por las leyes de la República del Perú: Ley N° 29733, D.S. N° 003-2013-JUS y Código Civil Peruano.</p>
            </SubSection>
            <SubSection title="16.4 Jurisdicción">
              <p>Tribunales de Lima, Perú. Posibilidad de conciliación extrajudicial previa. Acceso a la Autoridad Nacional de Protección de Datos Personales.</p>
            </SubSection>
            <SubSection title="16.5 Relación con Términos de Servicio">
              <p>Esta Política complementa nuestros Términos y Condiciones. En caso de conflicto sobre temas de privacidad, prevalece esta política.</p>
            </SubSection>
          </Section>

          <Section title="CONSENTIMIENTO INFORMADO">
            <p>Al crear una cuenta y utilizar los servicios de Clipealo, usted declara que:</p>
            <ul>
              <li>Ha leído y comprendido esta Política de Privacidad</li>
              <li>Consiente el tratamiento de sus datos personales según lo descrito</li>
              <li>Entiende sus derechos y cómo ejercerlos</li>
              <li>Acepta la transferencia internacional de datos cuando sea necesaria</li>
              <li>Autoriza el uso de cookies según lo indicado</li>
              <li>Comprende que puede retirar su consentimiento en cualquier momento</li>
            </ul>
            <p className="text-muted-foreground text-sm mt-6">
              Última actualización: 8 de febrero de 2026 · Versión 1.0<br />
              Clipealo - Comprometidos con la protección de su privacidad<br />
              Para consultas: clipealoai@gmail.com
            </p>
          </Section>

          <Section title="GLOSARIO">
            <ul>
              <li><strong>Datos Personales:</strong> información que identifica o hace identificable a una persona.</li>
              <li><strong>Tratamiento:</strong> cualquier operación sobre datos personales.</li>
              <li><strong>Titular:</strong> persona a quien pertenecen los datos personales.</li>
              <li><strong>Responsable del Tratamiento:</strong> Clipealo, quien decide sobre el uso de los datos.</li>
              <li><strong>Encargado del Tratamiento:</strong> terceros que procesan datos por cuenta de Clipealo.</li>
              <li><strong>Consentimiento:</strong> autorización libre, informada, expresa e inequívoca.</li>
              <li><strong>Cookies:</strong> pequeños archivos de texto almacenados en su dispositivo.</li>
              <li><strong>API:</strong> interfaz que permite conexión entre plataformas.</li>
              <li><strong>OAuth:</strong> protocolo de autorización segura.</li>
              <li><strong>Anonimización:</strong> proceso que hace imposible identificar a una persona.</li>
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

export default PrivacyPolicyPage;