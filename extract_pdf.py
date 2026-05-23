import sys
import PyPDF2

def extract_text(pdf_path):
    with open(pdf_path, 'rb') as file:
        reader = PyPDF2.PdfReader(file)
        text = ''
        for page in reader.pages:
            text += page.extract_text() + '\n'
        
        with open('extracted_contract.txt', 'w', encoding='utf-8') as out:
            out.write(text)

if __name__ == '__main__':
    extract_text(sys.argv[1])
