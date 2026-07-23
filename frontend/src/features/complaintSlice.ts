import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit'

export interface ComplaintDraft {
  complaint_source: string
  customer_name: string
  product_name: string
  product_strength_grade: string
  batch_lot_number: string
  manufacturing_date: string
  expiry_date: string
  quantity_affected: string
  complaint_type: string
  complaint_date: string
  detailed_description: string
  initial_severity: string
  priority: string
  next_action: string
  reasoning: string
  root_cause_category: string
  capa_recommendation: string
}

export interface RiskAssessment {
  initial_severity: string
  priority: string
  next_action: string
  reasoning: string
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  text: string
}

export interface ComplaintState {
  draft: ComplaintDraft
  risk: RiskAssessment
  messages: ChatMessage[]
  isLoading: boolean
  uploading: boolean
  savedComplaints: any[]
  selectedComplaint: any | null
  duplicateCount: number
  duplicates: any[]
}

const initialDraft: ComplaintDraft = {
  complaint_source: '',
  customer_name: '',
  product_name: '',
  product_strength_grade: '',
  batch_lot_number: '',
  manufacturing_date: '',
  expiry_date: '',
  quantity_affected: '',
  complaint_type: '',
  complaint_date: '',
  detailed_description: '',
  initial_severity: '',
  priority: '',
  next_action: '',
  reasoning: '',
  root_cause_category: '',
  capa_recommendation: '',
}

const initialRisk: RiskAssessment = {
  initial_severity: '',
  priority: '',
  next_action: '',
  reasoning: '',
}

const initialState: ComplaintState = {
  draft: initialDraft,
  risk: initialRisk,
  messages: [
    {
      id: 'welcome',
      role: 'assistant',
      text: 'Welcome to AIVOA Customer Complaint Copilot. You can log a new complaint by describing it below, or by dragging and dropping a document.',
    },
  ],
  isLoading: false,
  uploading: false,
  savedComplaints: [],
  selectedComplaint: null,
  duplicateCount: 0,
  duplicates: [],
}

// Async Thunks for API
export const logComplaintThunk = createAsyncThunk(
  'complaint/log',
  async (arg: { message: string; current_draft: ComplaintDraft }) => {
    const res = await fetch('/api/complaints/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(arg),
    })
    return res.json()
  }
)

export const editComplaintThunk = createAsyncThunk(
  'complaint/edit',
  async (arg: { message: string; current_draft: ComplaintDraft }) => {
    const res = await fetch('/api/complaints/edit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(arg),
    })
    return res.json()
  }
)

export const uploadDocumentThunk = createAsyncThunk(
  'complaint/upload',
  async (arg: { file: File; current_draft: ComplaintDraft }) => {
    const formData = new FormData()
    formData.append('file', arg.file)
    formData.append('current_draft', JSON.stringify(arg.current_draft))
    const res = await fetch('/api/complaints/extract-document', {
      method: 'POST',
      body: formData,
    })
    return res.json()
  }
)

export const saveComplaintThunk = createAsyncThunk(
  'complaint/save',
  async (draft: ComplaintDraft) => {
    const res = await fetch('/api/complaints', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(draft),
    })
    return res.json()
  }
)

export const fetchSavedComplaintsThunk = createAsyncThunk(
  'complaint/fetchAll',
  async () => {
    const res = await fetch('/api/complaints')
    return res.json()
  }
)

export const checkDuplicatesThunk = createAsyncThunk(
  'complaint/checkDuplicates',
  async (arg: { product_name?: string; batch_lot_number?: string }) => {
    const params = new URLSearchParams()
    if (arg.product_name) params.append('product_name', arg.product_name)
    if (arg.batch_lot_number) params.append('batch_lot_number', arg.batch_lot_number)
    const res = await fetch(`/api/complaints/check-duplicates?${params.toString()}`)
    return res.json()
  }
)

export const complaintSlice = createSlice({
  name: 'complaint',
  initialState,
  reducers: {
    addMessage: (state, action: PayloadAction<Omit<ChatMessage, 'id'>>) => {
      state.messages.push({
        ...action.payload,
        id: Math.random().toString(36).substring(7),
      })
    },
    resetForm: (state) => {
      state.draft = initialDraft
      state.risk = initialRisk
      state.duplicateCount = 0
      state.duplicates = []
      state.messages = [
        {
          id: 'welcome',
          role: 'assistant',
          text: 'Form reset. Ready to log a new customer complaint.',
        },
      ]
    },
    updateDraftField: (
      state,
      action: PayloadAction<{ key: keyof ComplaintDraft; value: string }>
    ) => {
      state.draft[action.payload.key] = action.payload.value
      if (action.payload.key === 'initial_severity' || action.payload.key === 'priority') {
        state.risk[action.payload.key] = action.payload.value
      } else if (action.payload.key === 'next_action' || action.payload.key === 'reasoning') {
        state.risk[action.payload.key] = action.payload.value
      }
    },
    updateRiskField: (
      state,
      action: PayloadAction<{ key: keyof RiskAssessment; value: string }>
    ) => {
      state.risk[action.payload.key] = action.payload.value
      if (action.payload.key === 'initial_severity' || action.payload.key === 'priority') {
        state.draft[action.payload.key] = action.payload.value
      } else if (action.payload.key === 'next_action' || action.payload.key === 'reasoning') {
        state.draft[action.payload.key] = action.payload.value
      }
    },
  },
  extraReducers: (builder) => {
    // Log
    builder.addCase(logComplaintThunk.pending, (state) => {
      state.isLoading = true
    })
    builder.addCase(logComplaintThunk.fulfilled, (state, action) => {
      state.isLoading = false
      state.draft = action.payload.draft || state.draft
      state.risk = action.payload.risk || state.risk
      state.messages.push({
        id: Math.random().toString(36).substring(7),
        role: 'assistant',
        text: action.payload.reply,
      })
    })
    builder.addCase(logComplaintThunk.rejected, (state) => {
      state.isLoading = false
    })

    // Edit
    builder.addCase(editComplaintThunk.pending, (state) => {
      state.isLoading = true
    })
    builder.addCase(editComplaintThunk.fulfilled, (state, action) => {
      state.isLoading = false
      state.draft = action.payload.draft || state.draft
      state.risk = action.payload.risk || state.risk
      state.messages.push({
        id: Math.random().toString(36).substring(7),
        role: 'assistant',
        text: action.payload.reply,
      })
    })
    builder.addCase(editComplaintThunk.rejected, (state) => {
      state.isLoading = false
    })

    // Upload
    builder.addCase(uploadDocumentThunk.pending, (state) => {
      state.uploading = true
    })
    builder.addCase(uploadDocumentThunk.fulfilled, (state, action) => {
      state.uploading = false
      state.draft = action.payload.draft || state.draft
      state.risk = action.payload.risk || state.risk
      state.messages.push({
        id: Math.random().toString(36).substring(7),
        role: 'assistant',
        text: action.payload.reply,
      })
    })
    builder.addCase(uploadDocumentThunk.rejected, (state) => {
      state.uploading = false
    })

    // Save
    builder.addCase(saveComplaintThunk.pending, (state) => {
      state.isLoading = true
    })
    builder.addCase(saveComplaintThunk.fulfilled, (state) => {
      state.isLoading = false
      state.draft = initialDraft
      state.risk = initialRisk
      state.duplicateCount = 0
      state.duplicates = []
      state.messages.push({
        id: Math.random().toString(36).substring(7),
        role: 'assistant',
        text: 'Complaint has been saved to the database successfully.',
      })
    })
    builder.addCase(saveComplaintThunk.rejected, (state) => {
      state.isLoading = false
    })

    // Fetch All
    builder.addCase(fetchSavedComplaintsThunk.fulfilled, (state, action) => {
      state.savedComplaints = action.payload
    })

    // Check Duplicates
    builder.addCase(checkDuplicatesThunk.fulfilled, (state, action) => {
      state.duplicateCount = action.payload.count
      state.duplicates = action.payload.duplicates
    })
  },
})

export const { addMessage, resetForm, updateDraftField, updateRiskField } = complaintSlice.actions
export default complaintSlice.reducer
