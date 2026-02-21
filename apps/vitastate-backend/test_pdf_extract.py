import sys
from pypdf import PdfReader

def extract_text(pdf_path):
    try:
        reader = PdfReader(pdf_path)
        text = ""
        for page in reader.pages:
            text += page.extract_text() + "\n"
        print(f"Successfully extracted {len(text)} characters.")
        print("--- Snippet ---")
        print(text[:500])
        print("---------------")
        return text
    except Exception as e:
        print(f"Error reading PDF: {e}")
        return None

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python test_pdf.py <path_to_pdf>")
    else:
        extract_text(sys.argv[1])
