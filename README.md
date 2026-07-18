# AuditIQ

**Smart Inventory Audits**

MVP web para analizar facturas PDF, compararlas con inventarios Excel o capturar manualmente el conteo físico. Extrae texto de facturas digitales, propone encabezados y líneas de producto, permite revisión manual, consolida productos y genera un reporte Excel adaptable.

Todo el procesamiento ocurre en el navegador. Los PDFs y archivos de inventario no se envían ni almacenan en servidores.

## Requisitos

- Node.js 20 o superior
- npm 10 o superior

## Instalación

```bash
npm install
```

## Desarrollo local

```bash
npm run dev
```

Abra `http://localhost:3000` en el navegador.

## Validaciones

```bash
npm run lint
npm run build
```

## Uso

1. Seleccione uno de los tres modos: análisis, comparación con Excel o conteo manual.
2. Seleccione hasta 200 facturas PDF con texto seleccionable.
3. Configure la concurrencia (3 de forma predeterminada) y procese la cola.
4. Si corresponde, importe un archivo XLSX, XLS o CSV o capture el conteo físico.
5. Corrija las líneas que indiquen **Revisión requerida**.
6. Revise los insights, la comparación y descargue el avance o reporte final.

La opción **Cargar datos de demostración** permite probar el flujo sin documentos.

## Despliegue en Vercel

1. Cree un repositorio nuevo en GitHub.
2. Desde esta carpeta ejecute `git add .`, `git commit -m "MVP auditoría de inventario"`, agregue el remoto y ejecute `git push -u origin main`.
3. En Vercel seleccione **Add New → Project** e importe el repositorio.
4. Mantenga el framework detectado como **Next.js**, el comando de compilación `npm run build` y despliegue.
5. Abra el sitio publicado y procese un PDF digital de prueba. Compruebe en las herramientas de red del navegador que `pdf.worker.min.mjs` carga correctamente desde el paquete compilado.

No se requieren variables de entorno, base de datos ni servicios externos.

## Privacidad

PDF.js y SheetJS se ejecutan del lado cliente. Cada PDF se lee individualmente dentro de una cola; después de procesarlo se destruye el documento de PDF.js y se elimina la referencia al archivo. Solo permanecen los datos estructurados y una vista de texto limitada para revisión. No se usa `localStorage` ni se convierten documentos completos a Base64.

## Limitaciones

- Solo funciona con PDFs que contienen texto seleccionable.
- No incluye OCR para documentos escaneados.
- La extracción usa expresiones regulares y heurísticas; algunos formatos requieren corrección manual.
- La coincidencia se limita a código exacto y descripción normalizada exacta para evitar uniones incorrectas.
- Los estilos avanzados y el formato condicional de Excel dependen del soporte de la edición comunitaria de SheetJS.
- Los resultados deben ser validados por un auditor.
