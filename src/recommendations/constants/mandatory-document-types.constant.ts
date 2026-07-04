import { DocumentType } from '../../vendor-documents/enums/document-type.enum';

// The vendor-documents module has no dedicated "mandatory" flag, so the
// compliance gate's required document set is defined here instead.
export const MANDATORY_DOCUMENT_TYPES: DocumentType[] = [
  DocumentType.INSURANCE,
  DocumentType.TRADE_LICENSE,
];
