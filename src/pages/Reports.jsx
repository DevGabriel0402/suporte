import Loading from '../components/Loading';
import { useState } from "react";
import {
  FileBarChart,
  Printer,
  FileSpreadsheet,
  FileText,
  Download,
  ArrowRight,
  ClipboardList,
  FileDown,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { exportCSV, exportExcel, printReport } from "../utils/export";
import { PDFDownloadLink } from "@react-pdf/renderer";
import ReportPDF from "../components/ReportPDF";
export default function Reports() {
  const { tasks, rooms } = useApp();
  const [room, setRoom] = useState("Todas as salas");
  const items = tasks.filter((t) => room === "Todas as salas" || t.room === room);
  const byRoom = rooms
    .map((r) => ({ room: r, count: tasks.filter((t) => t.room === r).length }))
    .filter((x) => x.count)
    .sort((a, b) => b.count - a.count);
  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">DADOS E PRESTAÇÃO DE CONTAS</span>
          <h1>Relatórios</h1>
          <p>Exporte ou imprima o levantamento de necessidades de TI.</p>
        </div>
      </div>
      <div className="report-summary">
        <div>
          <span>Registros no relatório</span>
          <strong>{items.length}</strong>
        </div>
        <div>
          <span>Em aberto</span>
          <strong>
            {
              items.filter((t) => t.status !== "Concluído" && t.status !== "Cancelado")
                .length
            }
          </strong>
        </div>
        <div>
          <span>Solicitados à direção</span>
          <strong>{items.filter((t) => t.requested).length}</strong>
        </div>
        <div>
          <span>Ambientes envolvidos</span>
          <strong>{new Set(items.map((t) => t.room)).size}</strong>
        </div>
      </div>
      <section className="panel report-export">
        <div className="report-title">
          <div className="report-icon">
            <FileBarChart />
          </div>
          <div>
            <h2>Gerar relatório</h2>
            <p>Selecione o escopo e escolha o formato desejado.</p>
          </div>
        </div>
        <label className="report-select-label">
          ESCOPO DO RELATÓRIO
          <select value={room} onChange={(e) => setRoom(e.target.value)}>
            <option>Todas as salas</option>
            {rooms.map((r) => (
              <option>{r}</option>
            ))}
          </select>
        </label>
        <div className="export-options">
          <button
            onClick={() =>
              printReport(
                items,
                room === "Todas as salas"
                  ? "Relatório geral de suporte de TI"
                  : `Relatório — ${room}`,
              )
            }
          >
            <div className="export-icon print">
              <Printer />
            </div>
            <strong>Imprimir relatório</strong>
            <span>Versão otimizada para papel ou salvar como PDF pelo navegador.</span>
            <b>
              Preparar impressão <ArrowRight size={14} />
            </b>
          </button>
          <PDFDownloadLink
            document={
              <ReportPDF
                items={items}
                title={
                  room === "Todas as salas"
                    ? "Relatório geral de suporte de TI"
                    : `Relatório — ${room}`
                }
              />
            }
            fileName={`relatorio-ti-${room === "Todas as salas" ? "geral" : room.toLowerCase().replaceAll(" ", "-")}.pdf`}
            className="pdf-download"
          >
            {({ loading }) => (
              <>
                <div className="export-icon pdf">
                  <FileDown />
                </div>
                <strong>Baixar relatório PDF</strong>
                <span>PDF paginado com resumo, protocolos, materiais e status.</span>
                <b>
                  {loading ? <Loading label="Preparando PDF..." inline /> : "Baixar arquivo PDF"}{" "}
                  <Download size={14} />
                </b>
              </>
            )}
          </PDFDownloadLink>
          <button onClick={() => exportExcel(items)}>
            <div className="export-icon excel">
              <FileSpreadsheet />
            </div>
            <strong>Planilha Excel (.xlsx)</strong>
            <span>Dados organizados em colunas, prontos para edição e análise.</span>
            <b>
              Baixar arquivo Excel <Download size={14} />
            </b>
          </button>
          <button onClick={() => exportCSV(items)}>
            <div className="export-icon csv">
              <FileText />
            </div>
            <strong>Arquivo CSV (.csv)</strong>
            <span>Formato compatível com planilhas e outros sistemas.</span>
            <b>
              Baixar arquivo CSV <Download size={14} />
            </b>
          </button>
        </div>
        <div className="report-note">
          <ClipboardList size={17} />
          <span>
            O relatório respeita o filtro de ambiente selecionado e inclui descrição,
            materiais, status, prioridade e encaminhamento à direção.
          </span>
        </div>
      </section>
      <section className="panel report-room-panel">
        <div className="panel-heading">
          <div>
            <h2>Demandas por ambiente</h2>
            <p>Distribuição dos registros cadastrados</p>
          </div>
        </div>
        {byRoom.length ? (
          byRoom.map((r) => (
            <div className="room-report-row" key={r.room}>
              <div>
                <strong>{r.room}</strong>
                <span>
                  {r.count} {r.count === 1 ? "demanda" : "demandas"}
                </span>
              </div>
              <div className="room-report-bar">
                <i
                  style={{
                    width: `${Math.max(...byRoom.map((x) => x.count)) ? (r.count / Math.max(...byRoom.map((x) => x.count))) * 100 : 0}%`,
                  }}
                />
              </div>
              <button
                onClick={() => {
                  setRoom(r.room);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              >
                Selecionar <ArrowRight size={14} />
              </button>
            </div>
          ))
        ) : (
          <p className="muted-empty">Ainda não há registros por ambiente.</p>
        )}
      </section>
    </div>
  );
}
