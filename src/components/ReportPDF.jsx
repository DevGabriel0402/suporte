import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

const s = StyleSheet.create({
  page: {
    paddingHorizontal: 34,
    paddingTop: 66,
    paddingBottom: 56,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: "#192843",
  },
  running: {
    position: "absolute",
    top: 24,
    left: 34,
    right: 34,
    paddingBottom: 9,
    borderBottomWidth: 1,
    borderBottomColor: "#cbd5e1",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  brand: { fontSize: 13, fontWeight: "bold", color: "#234bb0" },
  muted: { fontSize: 9, color: "#475569" },
  title: { fontSize: 23, fontWeight: "bold", marginBottom: 7 },
  summary: { flexDirection: "row", gap: 8, marginTop: 17, marginBottom: 20 },
  metric: { flex: 1, padding: 10, backgroundColor: "#eef3fc", borderRadius: 5 },
  value: { fontSize: 19, fontWeight: "bold", marginTop: 4 },
  section: { fontSize: 13, fontWeight: "bold", marginBottom: 9 },
  entry: { borderTopWidth: 1, borderTopColor: "#dbe3ef", paddingVertical: 11 },
  entryHeader: { flexDirection: "row", justifyContent: "space-between", gap: 12 },
  protocol: { fontSize: 11, color: "#234bb0", fontWeight: "bold", flex: 1 },
  badge: {
    color: "#1e3a8a",
    backgroundColor: "#eaf0ff",
    paddingVertical: 3,
    paddingHorizontal: 6,
    borderRadius: 4,
    fontSize: 9,
  },
  detail: { marginTop: 5, lineHeight: 1.45 },
  footer: {
    position: "absolute",
    bottom: 23,
    left: 34,
    right: 34,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#cbd5e1",
    flexDirection: "row",
    justifyContent: "space-between",
  },
});

function formatDate(value) {
  const date = new Date(value + "T12:00:00");
  return Number.isNaN(date.getTime()) ? "Sem data" : date.toLocaleDateString("pt-BR");
}

export default function ReportPDF({ items, title }) {
  const metrics = [
    ["Registros", items.length],
    [
      "Em aberto",
      items.filter((item) => !["Concluído", "Cancelado"].includes(item.status)).length,
    ],
    ["Concluídos", items.filter((item) => item.status === "Concluído").length],
    ["Encaminhados à direção", items.filter((item) => item.requested).length],
  ];

  return (
    <Document title={title} author="ConectaTI" language="pt-BR">
      <Page size="A4" style={s.page}>
        <View style={s.running} fixed>
          <Text style={s.brand}>ConectaTI</Text>
          <Text style={s.muted}>GESTÃO DE SUPORTE ESCOLAR</Text>
        </View>
        <Text style={s.title}>{title}</Text>
        <Text style={s.muted}>Emitido em {new Date().toLocaleString("pt-BR")}</Text>
        <View style={s.summary} wrap={false}>
          {metrics.map(([label, value]) => (
            <View key={label} style={s.metric}>
              <Text style={s.muted}>{label}</Text>
              <Text style={s.value}>{value}</Text>
            </View>
          ))}
        </View>
        <Text style={s.section} minPresenceAhead={52}>
          Detalhamento dos atendimentos
        </Text>
        {items.length === 0 && (
          <Text style={s.muted}>Nenhum atendimento no escopo selecionado.</Text>
        )}
        {items.map((item) => (
          <View key={item.id} style={s.entry}>
            <View minPresenceAhead={25} wrap={false}>
              <View style={s.entryHeader}>
                <Text style={s.protocol}>
                  {item.id} · {item.room}
                </Text>
                <Text style={s.badge}>{item.status}</Text>
              </View>
              <Text style={[s.muted, s.detail]}>
                {formatDate(item.date)} · {item.category} · Prioridade{" "}
                {item.priority || "não informada"} · Direção:{" "}
                {item.requested ? "encaminhado" : "sem encaminhamento"}
              </Text>
            </View>
            <Text style={s.detail}>Responsável: {item.assignee || "Não definido"} · Prazo: {item.dueDate ? formatDate(item.dueDate) : "Sem prazo"}</Text>
                <Text style={s.detail}>{item.description}</Text>
            {item.materials && <Text style={s.detail}>Materiais: {item.materials}</Text>}
            {item.notes && <Text style={s.detail}>Observações: {item.notes}</Text>}
          </View>
        ))}
        <View style={s.footer} fixed>
          <Text style={s.muted}>ConectaTI · Relatório de suporte</Text>
          <Text
            style={s.muted}
            render={({ pageNumber, totalPages }) =>
              `Página ${pageNumber} de ${totalPages}`
            }
          />
        </View>
      </Page>
    </Document>
  );
}
