import { useState, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { usePerfil } from '../contexts/PerfilContext';
import * as api from '../api';
import { useUploadThing } from '../utils/uploadthing';
import toast from 'react-hot-toast';
import {
  FileText, Upload, Download, Trash2, CheckCircle, XCircle,
  AlertTriangle, FileWarning, Package, Info, Eye
} from 'lucide-react';

const MIME_LABELS = {
  'application/pdf': 'PDF',
  'image/jpeg': 'JPG',
  'image/png': 'PNG',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
};

function DocumentoCard({ doc, perfilId, onRefetch }) {
  const fileRef = useRef();
  const [deleting, setDeleting] = useState(false);
  // currentCodigo é um ref para que o onClientUploadComplete acesse o valor correto
  const currentCodigo = useRef(doc.codigo);

  const { startUpload, isUploading } = useUploadThing('documentoUploader', {
    onClientUploadComplete: async (res) => {
      try {
        const file = res[0];
        const fileUrl = file.ufsUrl || file.url;
        const response = await api.salvarUrlDocumento(perfilId, currentCodigo.current, {
          url: fileUrl,
          nome: file.name,
          tamanho_bytes: file.size,
          mime_type: file.type,
        });
        if (response.data.aviso) toast(response.data.aviso, { icon: '⚠️' });
        else toast.success('Documento enviado!');
        onRefetch();
      } catch (err) {
        toast.error(err.response?.data?.error?.message || 'Erro ao salvar documento.');
      } finally {
        if (fileRef.current) fileRef.current.value = '';
      }
    },
    onUploadError: (err) => {
      toast.error(err.message || 'Erro no upload. Tente novamente.');
      if (fileRef.current) fileRef.current.value = '';
    },
  });

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    currentCodigo.current = doc.codigo;
    await startUpload([file]);
  };

  const handleDelete = async () => {
    if (!confirm(`Remover "${doc.titulo}"?`)) return;
    setDeleting(true);
    try {
      await api.deletarDocumento(perfilId, doc.codigo);
      toast.success('Documento removido.');
      onRefetch();
    } catch {
      toast.error('Erro ao remover documento.');
    } finally {
      setDeleting(false);
    }
  };

  const handleVer = () => {
    if (doc.enviado?.url_arquivo) {
      window.open(doc.enviado.url_arquivo, '_blank', 'noopener,noreferrer');
    }
  };

  if (doc.nao_aplicavel) {
    return (
      <div className="card p-4 opacity-50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-bg-elevated flex items-center justify-center flex-shrink-0">
            <FileText size={16} className="text-text-subtle" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-text-muted line-through">{doc.titulo}</div>
            <span className="badge-muted text-xs mt-1">Não aplicável</span>
          </div>
        </div>
      </div>
    );
  }

  const enviado = doc.enviado;
  const isDocx = enviado?.is_docx;
  const statusIcon = enviado
    ? (isDocx ? <AlertTriangle size={16} className="text-status-warning" /> : <CheckCircle size={16} className="text-status-success" />)
    : <XCircle size={16} className="text-status-danger" />;
  const statusClass = enviado ? (isDocx ? 'border-status-warning/20' : 'border-status-success/20') : 'border-status-danger/15';

  return (
    <div className={`card p-4 border ${statusClass} transition-all`}>
      <div className="flex items-start gap-3">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${enviado ? (isDocx ? 'bg-status-warning/15' : 'bg-status-success/15') : 'bg-status-danger/10'}`}>
          <FileText size={16} className={enviado ? (isDocx ? 'text-status-warning' : 'text-status-success') : 'text-status-danger'} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-text-primary">{doc.titulo}</span>
            {doc.condicional && <span className="badge-info text-xs">Condicional</span>}
            {statusIcon}
          </div>
          <p className="text-xs text-text-muted mt-1 leading-relaxed">{doc.descricao}</p>

          {enviado && (
            <div className="mt-2 flex items-center gap-2 flex-wrap">
              <span className="text-xs text-text-subtle truncate max-w-[180px]">{enviado.nome_arquivo_original}</span>
              <span className="badge-muted">{MIME_LABELS[enviado.mime_type] || 'arquivo'}</span>
              {enviado.tamanho_bytes > 0 && (
                <span className="text-xs text-text-subtle">{(enviado.tamanho_bytes / 1024).toFixed(0)} KB</span>
              )}
            </div>
          )}

          {isDocx && (
            <div className="alert-warning mt-3 text-xs">
              <FileWarning size={14} className="flex-shrink-0" />
              <span>Este arquivo é .docx — converta para PDF antes de gerar o pacote final.</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 mt-4 flex-wrap">
        <input
          ref={fileRef}
          type="file"
          id={`upload-${doc.codigo}`}
          accept=".pdf,.jpg,.jpeg,.png,.docx"
          className="hidden"
          onChange={handleFileChange}
          aria-label={`Enviar ${doc.titulo}`}
        />
        <label
          htmlFor={`upload-${doc.codigo}`}
          className={`btn ${enviado ? 'btn-outline btn-sm' : 'btn-primary btn-sm'} cursor-pointer ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
        >
          {isUploading ? (
            <span className="flex items-center gap-1"><span className="w-3 h-3 border-2 border-current/30 border-t-current rounded-full animate-spin" /> Enviando...</span>
          ) : (
            <span className="flex items-center gap-1"><Upload size={13} />{enviado ? 'Reenviar' : 'Enviar'}</span>
          )}
        </label>

        {enviado && (
          <>
            <button onClick={handleVer} className="btn-ghost btn-sm flex items-center gap-1" aria-label="Ver documento">
              <Eye size={13} /> Ver
            </button>
            <button onClick={handleDelete} disabled={deleting} className="btn-danger btn-sm flex items-center gap-1" aria-label="Remover documento">
              <Trash2 size={13} /> {deleting ? '...' : 'Remover'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function Documentos() {
  const { perfilAtivo } = usePerfil();
  const [gerando, setGerando] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['documentos', perfilAtivo?.id],
    queryFn: () => api.listarDocumentos(perfilAtivo.id),
    enabled: !!perfilAtivo?.id,
  });

  const docs = data?.data?.documentos || [];
  const progresso = data?.data?.progresso || { total: 0, enviados: 0, percentual: 0 };

  const handleGerarBaixarPacote = async () => {
    setGerando(true);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`/api/perfis/${perfilAtivo.id}/documentos/gerar-pacote`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data?.error?.message || 'Erro ao gerar pacote.');
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'pacote_documentos_trilhas_inova3.pdf';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success('Pacote PDF baixado com sucesso!');
    } catch (err) {
      toast.error(err.message || 'Erro ao gerar pacote.');
    } finally {
      setGerando(false);
    }
  };

  const podeGerarPacote = progresso.percentual === 100 && !docs.some(d => d.enviado?.is_docx && !d.nao_aplicavel);
  const temDocx = docs.some(d => d.enviado?.is_docx && !d.nao_aplicavel);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <div className="section-header">
          <div className="section-icon"><FileText size={18} /></div>
          <h1 className="section-title">Central de Documentos</h1>
        </div>

        {/* Progress + Pacote */}
        <div className="card card-body">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-text-muted">{progresso.enviados} de {progresso.total} documentos prontos</span>
            <span className="text-sm font-bold text-gradient-cerulean font-display">{progresso.percentual}%</span>
          </div>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${progresso.percentual}%` }} role="progressbar" aria-valuenow={progresso.percentual} aria-valuemin={0} aria-valuemax={100} />
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <button
              id="btn-gerar-pacote"
              onClick={handleGerarBaixarPacote}
              disabled={!podeGerarPacote || gerando}
              className="btn-gold"
            >
              {gerando ? (
                <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-bg-deep/30 border-t-bg-deep rounded-full animate-spin" />Gerando PDF...</span>
              ) : (
                <span className="flex items-center gap-2"><Package size={16} /><Download size={14} />Gerar e Baixar Pacote PDF</span>
              )}
            </button>
          </div>

          {!podeGerarPacote && (
            <p className="text-xs text-text-muted mt-3">
              {temDocx
                ? '⚠️ Converta os arquivos .docx para PDF antes de gerar o pacote.'
                : `Envie todos os ${progresso.total} documentos obrigatórios para habilitar o pacote.`}
            </p>
          )}
        </div>
      </div>

      {/* Lista */}
      {isLoading ? (
        <div className="space-y-3">
          {[1,2,3,4,5,6].map(i => <div key={i} className="skeleton h-28 rounded-xl2" />)}
        </div>
      ) : docs.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon"><FileText size={32} /></div>
          <p className="text-text-muted text-sm">Nenhum documento encontrado.<br/>Tente recarregar a página.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {docs.map(doc => (
            <DocumentoCard key={doc.codigo} doc={doc} perfilId={perfilAtivo.id} onRefetch={refetch} />
          ))}
        </div>
      )}

      <div className="alert-info text-xs">
        <Info size={14} className="flex-shrink-0" />
        <span>Formatos aceitos: PDF, JPG, PNG, DOCX · Limite: 5 MB por arquivo · Reenviar substitui o arquivo anterior.</span>
      </div>
    </div>
  );
}
