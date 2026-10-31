const typeLabels = { sick: "ลาป่วย", personal: "ลากิจ", other: "ลาอื่น ๆ" };
const statusLabels = { pending: "รอครูพิจารณา", approved: "อนุมัติ", rejected: "ไม่อนุมัติ" };
const periodLabels = { full: "เต็มวัน", morning: "ช่วงเช้า", afternoon: "ช่วงบ่าย", custom: "ระบุเวลาเอง" };

export async function notifyLeave(request, kind) {
  const token = process.env.LINE_MESSAGING_CHANNEL_ACCESS_TOKEN?.trim();
  if (!token) return false;
  if (!/^U[0-9a-fA-F]{32}$/.test(request.userId)) return false;
  const title = kind === "receipt" ? "รับคำขอลาแล้ว" : "ผลการพิจารณาคำขอลา";
  const accent = kind === "receipt" ? "#4168dc" : request.status === "approved" ? "#19876a" : "#c65565";
  const date = request.startDate === request.endDate ? request.startDate : `${request.startDate} – ${request.endDate}`;
  const period = request.period === "custom" && request.startTime && request.endTime
    ? `${request.startTime}–${request.endTime} น.` : periodLabels[request.period] ?? "เต็มวัน";
  const lines = [
    { type: "text", text: `รหัสคำขอ: ${request.id.slice(0, 8).toUpperCase()}`, size: "sm", color: "#667085" },
    { type: "text", text: `${typeLabels[request.type] ?? "ลาเรียน"} · ${date}`, size: "md", weight: "bold", wrap: true, margin: "md", color: "#172038" },
    { type: "text", text: `ช่วงเวลา: ${period}`, size: "sm", color: "#465268", margin: "sm" },
    { type: "text", text: `สถานะ: ${statusLabels[request.status] ?? request.status}`, size: "md", color: accent, margin: "md", weight: "bold" },
  ];
  if (kind === "decision" && request.teacherReason) lines.push({
    type: "text", text: `คำชี้แจงจากครู: ${request.teacherReason.slice(0, 300)}`,
    size: "sm", wrap: true, margin: "md", color: "#465268",
  });
  const response = await fetch("https://api.line.me/v2/bot/message/push", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      to: request.userId,
      messages: [{
        type: "flex",
        altText: kind === "receipt" ? "ระบบรับคำขอลาแล้ว" : `ผลคำขอลา: ${statusLabels[request.status] ?? request.status}`,
        contents: {
          type: "bubble",
          size: "mega",
          header: { type: "box", layout: "vertical", backgroundColor: accent, paddingAll: "20px",
            contents: [{ type: "text", text: title, weight: "bold", size: "lg", color: "#FFFFFF" }] },
          body: { type: "box", layout: "vertical", paddingAll: "20px", contents: lines },
          footer: { type: "box", layout: "vertical", contents: [{
            type: "text", text: "ตรวจสอบรายละเอียดได้ในเว็บลาเรียน", size: "xs", color: "#788398", wrap: true,
          }] },
        },
      }],
    }),
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) throw new Error(`LINE push failed: ${response.status}`);
  return true;
}
