import io
import email
from email import policy
from pypdf import PdfReader

# lazy import docx to keep startup light
def parse_docx(raw_bytes: bytes) -> str:
    try:
        import docx
        doc = docx.Document(io.BytesIO(raw_bytes))
        text = "\n".join(p.text for p in doc.paragraphs)
        if not text.strip():
            raise ValueError("Docx parsed empty text")
        return text
    except Exception as e:
        try:
            decoded = raw_bytes.decode("utf-8")
            if any(c.isalnum() for c in decoded):
                return decoded
        except Exception:
            pass
        return f"[Docx parsing error: {str(e)}]"

def extract_text(filename: str, raw_bytes: bytes) -> str:
    ext = filename.lower().rsplit(".", 1)[-1]
    if ext == "pdf":
        try:
            reader = PdfReader(io.BytesIO(raw_bytes))
            text = "\n".join(p.extract_text() or "" for p in reader.pages)
            if not text.strip():
                raise ValueError("PDF reader extracted empty text")
            return text
        except Exception as e:
            try:
                decoded = raw_bytes.decode("utf-8")
                if any(c.isalnum() for c in decoded):
                    return decoded
            except Exception:
                pass
            return f"[PDF parsing error: {str(e)}]"
    elif ext == "docx":
        return parse_docx(raw_bytes)
    elif ext == "eml":
        try:
            msg = email.message_from_bytes(raw_bytes, policy=policy.default)
            body = msg.get_body(preferencelist=("plain", "html"))
            if body:
                return body.get_content()
            return msg.get_payload() or ""
        except Exception as e:
            return f"[EML parsing error: {str(e)}]"
    else:
        # text / txt fallback
        try:
            return raw_bytes.decode("utf-8")
        except UnicodeDecodeError:
            return raw_bytes.decode("latin-1", errors="ignore")
