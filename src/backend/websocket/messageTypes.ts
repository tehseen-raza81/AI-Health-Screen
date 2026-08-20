import { ExtractedHealthInfo, Message, StructuredHealthReport } from '../interfaces/IHealthReportService';
import { CallStatus } from '../conversation/ConversationState';

// Client -> Server
export type ClientMessageType =
  | 'start_call'
  | 'audio_chunk'
  | 'audio_turn_complete'
  | 'user_text'
  | 'end_call'
  | 'ping';

export interface ClientMessage {
  type: ClientMessageType;
  language?: string;
  audioBase64?: string;
  mimeType?: string;
  text?: string;
}

// Server -> Client
export type ServerMessageType =
  | 'call_started'
  | 'status_change'
  | 'transcript_update'
  | 'extracted_state_update'
  | 'audio_response'
  | 'report_ready'
  | 'error'
  | 'pong';

export interface ServerMessage {
  type: ServerMessageType;
  status?: CallStatus;
  message?: string;
  newMessage?: Message;
  history?: Message[];
  extractedInfo?: ExtractedHealthInfo;
  audioBase64?: string;
  mimeType?: string;
  report?: StructuredHealthReport;
  error?: string;
}
