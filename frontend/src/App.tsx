import React, { useState, useEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { RootState, AppDispatch } from './app/store'
import {
  logComplaintThunk,
  editComplaintThunk,
  uploadDocumentThunk,
  saveComplaintThunk,
  fetchSavedComplaintsThunk,
  checkDuplicatesThunk,
  resetForm,
  updateDraftField,
  updateRiskField,
} from './features/complaintSlice'
// @ts-ignore
import newLogo from './app/assest/new-logo.png'

const placeholders = [
  "Supported formats: PDF, DOCX, TXT, EML | Max file size: 10MB",
  "Paste Complaint Text / Email",
  
]

const getFileIcon = (filename: string) => {
  const ext = filename.toLowerCase().split('.').pop()
  if (ext === 'pdf') {
    return (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" className="shrink-0">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <text x="6" y="17" fontSize="7" fontWeight="900" fill="#ef4444" fontFamily="sans-serif">PDF</text>
      </svg>
    )
  }
  if (ext === 'docx' || ext === 'doc') {
    return (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.5" className="shrink-0">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <text x="7" y="17" fontSize="7" fontWeight="900" fill="#2563eb" fontFamily="sans-serif">DOC</text>
      </svg>
    )
  }
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.5" className="shrink-0">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <text x="7" y="17" fontSize="7" fontWeight="900" fill="#64748b" fontFamily="sans-serif">TXT</text>
    </svg>
  )
}

const formatChatMessage = (text: string) => {
  if (!text) return "";
  const parts = text.split(/\*\*([^*]+)\*\*/g);
  return parts.map((part, index) => {
    if (index % 2 === 1) {
      return <strong key={index} className="font-extrabold text-slate-900">{part}</strong>;
    }
    return part;
  });
};

const App: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>()
  const { draft, risk, messages, isLoading, uploading, savedComplaints, duplicateCount, duplicates } = useSelector(
    (state: RootState) => state.complaint
  )
  const isDraftEmpty = Object.values(draft).every((v) => !v)


  const cleanDesc = (draft.detailed_description || '').trim().toLowerCase()
  const isGreeting = ['hi', 'hii', 'hello', 'hey', 'test', 'dear', 'ok', 'yes', 'no'].includes(cleanDesc)

  const requiredFields = ["product_name", "batch_lot_number", "complaint_type", "detailed_description", "customer_name"]
  const filledFields = requiredFields.filter(f => {
    if (f === 'detailed_description') {
      return draft.detailed_description && !isGreeting
    }
    return draft[f as keyof typeof draft]
  })
  const completenessScore = isDraftEmpty ? 0 : Math.round((filledFields.length / requiredFields.length) * 100)


  const [chatText, setChatText] = useState('')
  const [attachedFile, setAttachedFile] = useState<File | null>(null)
  const [showSavedModal, setShowSavedModal] = useState(false)
  const [placeholderText, setPlaceholderText] = useState(placeholders[0])
  const [fadeClass, setFadeClass] = useState('fade-in')
  const [isFocused, setIsFocused] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const nextActionRef = useRef<HTMLTextAreaElement>(null)
  const reasoningRef = useRef<HTMLTextAreaElement>(null)
  const chatInputRef = useRef<HTMLTextAreaElement>(null)
  const rootCauseRef = useRef<HTMLTextAreaElement>(null)
  const capaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Trigger check duplicates when product_name or batch_lot_number changes
  useEffect(() => {
    if (draft.product_name || draft.batch_lot_number) {
      dispatch(checkDuplicatesThunk({
        product_name: draft.product_name || undefined,
        batch_lot_number: draft.batch_lot_number || undefined
      }))
    }
  }, [draft.product_name, draft.batch_lot_number, dispatch])

  // Resizing textarea height dynamically based on value content
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [draft.detailed_description])

  useEffect(() => {
    if (rootCauseRef.current) {
      rootCauseRef.current.style.height = 'auto'
      rootCauseRef.current.style.height = `${rootCauseRef.current.scrollHeight}px`
    }
  }, [draft.root_cause_category])

  useEffect(() => {
    if (capaRef.current) {
      capaRef.current.style.height = 'auto'
      capaRef.current.style.height = `${capaRef.current.scrollHeight}px`
    }
  }, [draft.capa_recommendation])

  useEffect(() => {
    if (nextActionRef.current) {
      nextActionRef.current.style.height = 'auto'
      nextActionRef.current.style.height = `${nextActionRef.current.scrollHeight}px`
    }
  }, [risk.next_action])

  useEffect(() => {
    if (reasoningRef.current) {
      reasoningRef.current.style.height = 'auto'
      reasoningRef.current.style.height = `${reasoningRef.current.scrollHeight}px`
    }
  }, [risk.reasoning])

  useEffect(() => {
    if (chatInputRef.current) {
      chatInputRef.current.style.height = 'auto'
      const maxHeight = 150
      const scrollHeight = chatInputRef.current.scrollHeight
      chatInputRef.current.style.height = `${Math.min(scrollHeight, maxHeight)}px`
      chatInputRef.current.style.overflowY = scrollHeight > maxHeight ? 'auto' : 'hidden'
    }
  }, [chatText])

  useEffect(() => {
    if (attachedFile) {
      chatInputRef.current?.focus()
    }
  }, [attachedFile])



  // Smooth placeholder rotation
  useEffect(() => {
    let index = 0
    const interval = setInterval(() => {
      setFadeClass('fade-out')
      setTimeout(() => {
        index = (index + 1) % placeholders.length
        setPlaceholderText(placeholders[index])
        setFadeClass('fade-in')
      }, 300)
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  const handleSendMessage = () => {
    if (uploading || isLoading) return
    
    if (attachedFile) {
      const file = attachedFile
      setAttachedFile(null)
      
      const fileMsg = `[Document Uploaded: ${file.name}]`
      const textMsg = chatText.trim()
      const combinedMsg = textMsg ? `${fileMsg}\n${textMsg}` : fileMsg
      
      setChatText('')
      
      dispatch({
        type: 'complaint/addMessage',
        payload: { role: 'user', text: combinedMsg },
      })
      
      dispatch(uploadDocumentThunk({ file, current_draft: draft }))
      return
    }
    
    if (!chatText.trim()) return
    const msg = chatText.trim()
    setChatText('')

    dispatch({
      type: 'complaint/addMessage',
      payload: { role: 'user', text: msg },
    })

    const isDraftEmpty = Object.values(draft).every((v) => !v)
    if (isDraftEmpty) {
      dispatch(logComplaintThunk({ message: msg, current_draft: draft }))
    } else {
      dispatch(editComplaintThunk({ message: msg, current_draft: draft }))
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (uploading) return
    const files = e.target.files
    if (files && files.length > 0) {
      setAttachedFile(files[0])
    }
  }

  const handleSave = () => {
    dispatch(saveComplaintThunk(draft))
  }

  const handleViewSaved = () => {
    dispatch(fetchSavedComplaintsThunk())
    setShowSavedModal(true)
  }

  const showPlaceholder = !isFocused && !chatText && !attachedFile

  return (
    <>
      <header className="h-[60px] bg-white border-b border-slate-200 flex justify-between items-center px-6">
        <div className="flex items-center gap-3">
          <img src={newLogo} alt="AIVOA Logo" className="h-7 w-auto object-contain" />
          <span className="text-slate-300 font-normal">|</span>
          <span className="text-sm font-medium text-slate-500">Quality Management System</span>
        </div>
        <div className="flex gap-3">
          <button
            className="bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold text-sm rounded-lg py-2 px-4 transition duration-200"
            onClick={handleViewSaved}
          >
            View Saved
          </button>
          <button
            className="bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold text-sm rounded-lg py-2 px-4 transition duration-200"
            onClick={() => dispatch(resetForm())}
          >
            Reset Form
          </button>
          <button
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-lg py-2 px-5 transition duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
            onClick={handleSave}
            disabled={isLoading || !draft.product_name || duplicateCount > 0}
          >
            Save Complaint
          </button>
        </div>
      </header>

      <div className="grid grid-cols-[1.2fr_1fr] h-[calc(100vh-60px)] overflow-hidden">
        {/* Left Panel: Complaint Form */}
        <div className="p-6 overflow-y-auto border-r border-slate-200 flex flex-col gap-2 bg-white">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-[24px] font-bold text-slate-900">Log Customer Complaint</h2>
              <p className="text-[13px] text-slate-500 mt-1">API & FDF Quality Assurance Module</p>
            </div>
            <div className="border border-amber-300 bg-amber-50 text-amber-700 px-4 py-1.5 rounded-lg font-semibold text-[13px]">
              Pending Triage
            </div>
          </div>


{/* Duplicate Complaint Warning Alert */}
          {duplicateCount > 0 && (
            <div className="mb-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-3.5 flex items-start gap-3 shadow-sm">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-amber-600 mt-0.5 shrink-0">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              <div className="flex flex-col gap-0.5 text-xs font-medium leading-relaxed">
                <span className="font-bold text-[13px] text-amber-900">
                  Duplicate Records Detected ({duplicateCount})
                </span>
                <span>
                  Other complaints exist with the same Product Name or Batch Number. Reference ID(s):{" "}
                  {duplicates.map((d: any) => `#${d.id} (${d.created_at})`).join(', ')}.
                </span>
              </div>
            </div>
          )}
          
          {/* Completeness Bar */}
          <div className="mb-4 bg-slate-50 border border-slate-200/60 rounded-xl p-4 flex flex-col gap-2 shadow-sm">
            <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider text-slate-500">
              <span>Complaint Completeness</span>
              <span className={`text-[13px] font-extrabold ${completenessScore === 100 ? 'text-emerald-600' : completenessScore >= 60 ? 'text-amber-600' : 'text-rose-500'}`}>
                {completenessScore}% Complete
              </span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
              <div 
                className={`h-full transition-all duration-500 rounded-full ${completenessScore === 100 ? 'bg-emerald-500' : completenessScore >= 60 ? 'bg-amber-500' : 'bg-rose-500'}`}
                style={{ width: `${completenessScore}%` }}
              />
            </div>
            {completenessScore < 100 && (
              <span className="text-[13px] text-slate-800 font-medium">
                Missing: {requiredFields.filter(f => {
                  if (f === 'detailed_description') {
                    return !draft.detailed_description || isGreeting
                  }
                  return !draft[f as keyof typeof draft]
                }).map(f => f.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())).join(', ')}
              </span>
            )}
          </div>

          {/* Group 1 */}
          <div className="text-[12px] font-bold uppercase tracking-wider text-slate-500  pb-1 border-b border-slate-200">
            1. Origin & Customer Details
          </div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-semibold text-slate-700">Complaint Source</label>
              <input
                type="text"
                className="bg-white text-slate-800 font-semibold border border-slate-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded-lg py-2.5 px-3.5 text-sm outline-none transition-all duration-200"
                placeholder="Awaiting AI extraction..."
                value={draft.complaint_source || ''}
                onChange={(e) => dispatch(updateDraftField({ key: 'complaint_source', value: e.target.value }))}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-semibold text-slate-700">Customer Name</label>
              <input
                type="text"
                className="bg-white text-slate-800 font-semibold border border-slate-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded-lg py-2.5 px-3.5 text-sm outline-none transition-all duration-200"
                placeholder="Awaiting AI extraction..."
                value={draft.customer_name || ''}
                onChange={(e) => dispatch(updateDraftField({ key: 'customer_name', value: e.target.value }))}
              />
            </div>
          </div>

          {/* Group 2 */}
          <div className="text-[12px] font-bold uppercase tracking-wider text-slate-500  pb-1.5 border-b border-slate-200">
            2. Product & Batch Identification
          </div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-semibold text-slate-700">Product Name</label>
              <input
                type="text"
                className="bg-white text-slate-800 font-semibold border border-slate-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded-lg py-2.5 px-3.5 text-sm outline-none transition-all duration-200"
                placeholder="Awaiting AI extraction..."
                value={draft.product_name || ''}
                onChange={(e) => dispatch(updateDraftField({ key: 'product_name', value: e.target.value }))}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-semibold text-slate-700">Product Strength/Grade</label>
              <input
                type="text"
                className="bg-white text-slate-800 font-semibold border border-slate-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded-lg py-2.5 px-3.5 text-sm outline-none transition-all duration-200"
                placeholder="Awaiting AI extraction..."
                value={draft.product_strength_grade || ''}
                onChange={(e) => dispatch(updateDraftField({ key: 'product_strength_grade', value: e.target.value }))}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-semibold text-slate-700">Batch/Lot Number</label>
              <input
                type="text"
                className="bg-white text-slate-800 font-semibold border border-slate-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded-lg py-2.5 px-3.5 text-sm outline-none transition-all duration-200"
                placeholder="Awaiting AI extraction..."
                value={draft.batch_lot_number || ''}
                onChange={(e) => dispatch(updateDraftField({ key: 'batch_lot_number', value: e.target.value }))}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-semibold text-slate-700">Manufacturing Date</label>
              <input
                type="text"
                className="bg-white text-slate-800 font-semibold border border-slate-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded-lg py-2.5 px-3.5 text-sm outline-none transition-all duration-200"
                placeholder="Awaiting AI extraction..."
                value={draft.manufacturing_date || ''}
                onChange={(e) => dispatch(updateDraftField({ key: 'manufacturing_date', value: e.target.value }))}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-semibold text-slate-700">Expiry Date</label>
              <input
                type="text"
                className="bg-white text-slate-800 font-semibold border border-slate-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded-lg py-2.5 px-3.5 text-sm outline-none transition-all duration-200"
                placeholder="Awaiting AI extraction..."
                value={draft.expiry_date || ''}
                onChange={(e) => dispatch(updateDraftField({ key: 'expiry_date', value: e.target.value }))}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-semibold text-slate-700">Quantity Affected</label>
              <input
                type="text"
                className="bg-white text-slate-800 font-semibold border border-slate-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded-lg py-2.5 px-3.5 text-sm outline-none transition-all duration-200"
                placeholder="Awaiting AI extraction..."
                value={draft.quantity_affected || ''}
                onChange={(e) => dispatch(updateDraftField({ key: 'quantity_affected', value: e.target.value }))}
              />
            </div>
          </div>

          

          {/* Group 3 */}
          <div className="text-[12px] font-bold uppercase tracking-wider text-slate-500  pb-1.5 border-b border-slate-200">
            3. Complaint Details
          </div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="flex flex-col gap-1.5 col-span-2">
              <label className="text-[13px] font-semibold text-slate-700">Complaint Date</label>
              <input
                type="text"
                className="bg-white text-slate-800 font-semibold border border-slate-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded-lg py-2.5 px-3.5 text-sm outline-none transition-all duration-200"
                placeholder="Awaiting AI extraction..."
                value={draft.complaint_date || ''}
                onChange={(e) => dispatch(updateDraftField({ key: 'complaint_date', value: e.target.value }))}
              />
            </div>
          </div>

          {/* Group 4 */}
          <div className="text-[12px] font-bold uppercase tracking-wider text-slate-500  pb-1.5 border-b border-slate-200">
            4. Defect Analysis
          </div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="flex flex-col gap-1.5 col-span-2">
              <label className="text-[13px] font-semibold text-slate-700">Complaint Category</label>
              <input
                type="text"
                className="bg-white text-slate-800 font-semibold border border-slate-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded-lg py-2.5 px-3.5 text-sm outline-none transition-all duration-200"
                placeholder="Awaiting AI extraction..."
                value={draft.complaint_type || ''}
                onChange={(e) => dispatch(updateDraftField({ key: 'complaint_type', value: e.target.value }))}
              />
            </div>
            <div className="flex flex-col gap-1.5 col-span-2">
              <label className="text-[13px] font-semibold text-slate-700">Complaint Description</label>
              <textarea
                ref={textareaRef}
                rows={1}
                className="bg-white text-slate-800 border border-slate-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded-lg py-2 px-3 text-sm outline-none font-semibold shadow-sm transition-all duration-200 resize-none overflow-hidden"
                placeholder="Awaiting AI extraction..."
                value={draft.detailed_description || ''}
                onChange={(e) => dispatch(updateDraftField({ key: 'detailed_description', value: e.target.value }))}
              />
            </div>
          </div>

          {/* AI Copilot Risk Assessment Card */}
          <div className="bg-[#f5f7ff] border border-slate-200 rounded-xl p-5 mb-4 flex flex-col gap-4">
            <div className="flex items-center gap-2 text-[#4f46e5] font-bold text-sm">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              AI copilot risk assessment
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#4f46e5]/80">Severity (Suggested)</label>
                <input
                  type="text"
                  className="bg-white text-slate-800 border border-slate-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded-lg py-2 px-3 text-sm outline-none font-semibold shadow-sm transition-all duration-200"
                  placeholder="Awaiting assessment..."
                  value={draft.initial_severity || risk.initial_severity || ''}
                  onChange={(e) => dispatch(updateRiskField({ key: 'initial_severity', value: e.target.value }))}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#4f46e5]/80">Suggested Root Cause Category</label>
                <textarea
                  ref={rootCauseRef}
                  rows={1}
                  className="bg-white text-slate-800 border border-slate-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded-lg py-2 px-3 text-sm outline-none font-semibold shadow-sm transition-all duration-200 resize-none overflow-hidden"
                  placeholder="Awaiting assessment..."
                  value={draft.root_cause_category || ''}
                  onChange={(e) => dispatch(updateDraftField({ key: 'root_cause_category', value: e.target.value }))}
                />
              </div>
              <div className="flex flex-col gap-1.5 col-span-2">
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#4f46e5]/80">Suggested Next Action</label>
                <textarea
                  ref={nextActionRef}
                  rows={1}
                  className="bg-white text-slate-800 border border-slate-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded-lg py-2 px-3 text-sm outline-none font-semibold shadow-sm transition-all duration-200 resize-none overflow-hidden"
                  placeholder="Awaiting assessment..."
                  value={risk.next_action || ''}
                  onChange={(e) => dispatch(updateRiskField({ key: 'next_action', value: e.target.value }))}
                />
              </div>
              <div className="flex flex-col gap-1.5 col-span-2">
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#4f46e5]/80">Initial Risk Assessment</label>
                <textarea
                  ref={reasoningRef}
                  rows={1}
                  className="bg-white text-slate-800 border border-slate-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded-lg py-2 px-3 text-sm outline-none font-semibold shadow-sm transition-all duration-200 resize-none overflow-hidden"
                  placeholder="Awaiting assessment..."
                  value={risk.reasoning || ''}
                  onChange={(e) => dispatch(updateRiskField({ key: 'reasoning', value: e.target.value }))}
                />
              </div>
              <div className="flex flex-col gap-1.5 col-span-2">
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#4f46e5]/80">CAPA Recommendation Action Plan</label>
                <textarea
                  ref={capaRef}
                  rows={1}
                  className="bg-white text-slate-800 border border-slate-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded-lg py-2 px-3 text-sm outline-none font-semibold shadow-sm transition-all duration-200 resize-none overflow-hidden"
                  placeholder="Awaiting assessment..."
                  value={draft.capa_recommendation || ''}
                  onChange={(e) => dispatch(updateDraftField({ key: 'capa_recommendation', value: e.target.value }))}
                />
              </div>
            </div>
          </div>

          <button
            className="w-full bg-[#4f46e5] hover:bg-[#4338ca] text-white font-bold py-3.5 px-6 rounded-lg text-sm transition-all duration-200 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed mb-2"
            onClick={handleSave}
            disabled={isLoading || !draft.product_name || duplicateCount > 0}
          >
            Commit to QMS Ledger
          </button>
        </div>

        {/* Right Panel: Copilot area */}
        <div className="grid grid-rows-[auto_1fr_auto] h-full overflow-hidden bg-[#fafafa] border-l border-slate-200">
          {/* Header */}
          <div className="p-4 px-6 border-b border-slate-200 flex justify-between items-center bg-white">
            <div>
              <h3 className="flex items-center gap-2 text-base font-bold text-slate-900">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="2.5">
                  <path d="M6 3h12l-6 10v6m-3 3h6" />
                  <circle cx="12" cy="13" r="3" fill="#4f46e5" fillOpacity="0.2" />
                </svg>
                AIVOA Copilot
              </h3>
              <p className="text-[12px] text-slate-500 mt-0.5">Drop complaint files or paste text below.</p>
            </div>
            <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.6)]"></div>
          </div>

          {/* Chat Messages */}
          <div className="flex flex-col overflow-y-auto p-6 gap-6 flex-1 bg-[#fcfcfd]">
            {messages.map((m) => {
              const isAssistant = m.role === 'assistant';
              const isWelcome = m.id === 'welcome';
              return (
                <div key={m.id} className={`flex items-start gap-3 max-w-[90%] ${isAssistant ? 'self-start' : 'self-end flex-row-reverse'}`}>
                  {/* Avatar Icon */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border ${
                    isAssistant 
                      ? isWelcome 
                        ? 'bg-purple-50 border-purple-200 text-purple-600'
                        : 'bg-blue-50 border-blue-200 text-blue-600'
                      : 'bg-slate-100 border-slate-200 text-slate-600'
                  }`}>
                    {isAssistant ? (
                      isWelcome ? (
                        /* Thunderbolt icon */
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                        </svg>
                      ) : (
                        /* Check/tick icon */
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )
                    ) : (
                      /* User icon */
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                    )}
                  </div>

                  {/* Message Bubble */}
                  <div className={`p-4 rounded-xl text-sm leading-relaxed ${
                    isAssistant 
                      ? 'bg-white border border-slate-200 text-slate-700 shadow-sm' 
                      : 'bg-[#4f46e5] text-white font-medium shadow-sm'
                  }`}>
                    {formatChatMessage(m.text)}
                  </div>
                </div>
              );
            })}
            {isLoading && (
              <div className="flex items-start gap-3 max-w-[90%] self-start">
                <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 border bg-blue-50 border-blue-200 text-blue-600">
                  <span className="animate-pulse">●●●</span>
                </div>
                <div className="p-4 rounded-xl text-sm leading-relaxed bg-white border border-slate-200 text-slate-400 shadow-sm">
                  Parsing complaint...
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input Bar & Footer */}
          <div className="bg-white border-t border-slate-200 p-4 px-6 flex flex-col gap-3">
            <input
              type="file"
              id="chat-file-upload"
              className="hidden"
              onChange={handleFileSelect}
            />
            <div className="relative bg-[#fcfcfd] border border-slate-200 rounded-xl p-3 focus-within:border-[#4f46e5] focus-within:ring-2 focus-within:ring-[#4f46e5]/10 flex flex-col gap-1.5 transition-all duration-200">
              {attachedFile && (
                <div className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200/80 border border-slate-200 rounded-lg px-2.5 py-1.5 self-start text-xs font-semibold text-slate-700 shadow-sm transition duration-150 mb-1 z-[3]">
                  {getFileIcon(attachedFile.name)}
                  <span className="max-w-[150px] truncate">{attachedFile.name}</span>
                  <button 
                    onClick={() => setAttachedFile(null)}
                    className="text-slate-400 hover:text-red-500 transition duration-150 ml-1 rounded-full p-0.5 hover:bg-slate-200"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
              )}
              <div className="relative flex-1">
                {showPlaceholder && (
                  <span className={`absolute left-1.5 top-1 text-slate-400 text-sm pointer-events-none transition-opacity duration-300 z-[1] whitespace-nowrap overflow-hidden text-ellipsis max-w-[calc(100%-20px)] ${fadeClass}`}>
                    {placeholderText}
                  </span>
                )}
                <textarea
                  ref={chatInputRef}
                  rows={1}
                  className="w-full bg-transparent text-slate-900 text-sm outline-none resize-none z-[2] pr-2 py-1 pl-1.5"
                  value={chatText}
                  onChange={(e) => setChatText(e.target.value)}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSendMessage()
                    }
                  }}
                  disabled={isLoading || uploading}
                />
              </div>
              <div className="flex justify-between items-center mt-1 pt-1.5 border-t border-slate-100/60 z-[3]">
                <label htmlFor="chat-file-upload" className="cursor-pointer flex items-center p-1.5 hover:bg-slate-100 rounded-lg transition duration-200 text-slate-400 hover:text-slate-600">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                  </svg>
                </label>
                <button 
                  className="bg-[#4f46e5] hover:bg-[#4338ca] text-white p-2 rounded-lg transition duration-200 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center w-8 h-8 shadow-sm "
                  onClick={handleSendMessage} 
                  disabled={isLoading || uploading || !chatText.trim()}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-white transform rotate-45 -translate-y-0.5 -translate-x-0.5">
                    <line x1="22" y1="2" x2="11" y2="13" />
                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Saved Complaints List Modal */}
      {showSavedModal && (
        <div className="modal-overlay" onClick={() => setShowSavedModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="text-lg font-bold">Saved Customer Complaints</h3>
              <button
                className="bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold text-sm rounded-lg py-2 px-4 transition duration-200"
                onClick={() => setShowSavedModal(false)}
              >
                Close
              </button>
            </div>
            <div className="modal-body">
              {savedComplaints.length === 0 ? (
                <p className="text-slate-500 text-sm">No complaints saved yet.</p>
              ) : (
                savedComplaints.map((item) => (
                  <div key={item.id} className="border border-slate-200 rounded-lg p-4 mb-3 hover:border-blue-500 cursor-pointer transition duration-200">
                    <div className="flex justify-between items-start">
                      <h4 className="font-bold text-slate-900">{item.product_name || 'Unknown Product'} ({item.complaint_type || 'General Quality'})</h4>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${item.initial_severity === 'Critical' ? 'bg-red-50 text-red-600' :
                          item.initial_severity === 'Major' ? 'bg-amber-50 text-amber-600' :
                            'bg-emerald-50 text-emerald-600'
                        }`}>
                        {item.initial_severity || 'Low'}
                      </span>
                    </div>
                    <p className="text-[13px] text-slate-500 mt-1">
                      Customer: {item.customer_name || 'N/A'} | Batch: {item.batch_lot_number || 'N/A'}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Saved on: {item.created_at}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default App
