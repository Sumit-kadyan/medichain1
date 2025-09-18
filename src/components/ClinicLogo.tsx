
export default function ClinicLogo({ svg }: { svg?: string }) {
  if (!svg) return null;
  const dataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  return <img src={dataUrl} alt="Clinic Logo" style={{ width: 150, height: 50, objectFit: 'contain' }} />;
}
