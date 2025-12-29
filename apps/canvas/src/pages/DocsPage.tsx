import { useState, useEffect, useRef } from 'react';
import Prism from 'prismjs';
import 'prismjs/themes/prism-tomorrow.css';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-go';
import 'prismjs/components/prism-rust';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-toml';
import './docs.css';

type DocSection = 'getting-started' | 'installation' | 'typescript' | 'python' | 'go' | 'rust' | 'cli' | 'api' | 'examples' | 'comparison';

interface DocContent {
  id: DocSection;
  title: string;
  icon: string;
  searchText: string;
}

const sections: DocContent[] = [
  { id: 'getting-started', title: 'Getting Started', icon: '🚀', searchText: 'intro overview features llm tokens reduction json compatible auto-increment enum detection multi-language typescript python go rust' },
  { id: 'installation', title: 'Installation', icon: '📦', searchText: 'install npm pip cargo go get bun yarn uv setup dependencies package' },
  { id: 'typescript', title: 'TypeScript / JavaScript', icon: '🟦', searchText: 'typescript javascript ts js node bun deno browser encode decode Zoon class schema zonSchema encodeWithSchema' },
  { id: 'python', title: 'Python', icon: '🐍', searchText: 'python pip uv encode decode pandas dataframe zoon-format ZoonError exception' },
  { id: 'go', title: 'Go', icon: '🔵', searchText: 'golang go marshal unmarshal struct json tag encoder decoder newencoder newdecoder io reader writer' },
  { id: 'rust', title: 'Rust', icon: '🦀', searchText: 'rust cargo serde serialize deserialize crate zoon-format ZoonError result error handling' },
  { id: 'cli', title: 'CLI', icon: '⌨️', searchText: 'command line interface terminal pipe stdin stdout stats statistics encode decode output file' },
  { id: 'api', title: 'API Reference', icon: '📚', searchText: 'api reference encode decode options schema inferEnums enumThreshold type markers string integer boolean null auto-increment' },
  { id: 'examples', title: 'Examples', icon: '💡', searchText: 'examples tabular inline format arrays objects nested null handling configuration' },
  { id: 'comparison', title: 'Format Comparison', icon: '📊', searchText: 'comparison benchmark json toon zon csv tokens accuracy savings performance' },
];

function CodeBlock({ code, language, title }: { code: string; language: string; title?: string }) {
  const [copied, setCopied] = useState(false);
  const codeRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (codeRef.current) {
      Prism.highlightElement(codeRef.current);
    }
  }, [code]);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyMarkdown = () => {
    const markdown = `\`\`\`${language}\n${code}\n\`\`\``;
    navigator.clipboard.writeText(markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="docs-code-block">
      <div className="docs-code-header">
        <span>{title || language}</span>
        <div className="code-actions">
          <button className="code-action-btn" onClick={handleCopy} title="Copy code">
            {copied ? '✅ Copied!' : '📋 Copy'}
          </button>
        </div>
      </div>
      <pre className={`language-${language}`}>
        <code ref={codeRef} className={`language-${language}`}>{code}</code>
      </pre>
    </div>
  );
}

function convertToMarkdown(element: Element): string {
  const processNode = (node: Node): string => {
    if (node.nodeType === Node.TEXT_NODE) return node.textContent || '';
    if (node.nodeType !== Node.ELEMENT_NODE) return '';
    
    const el = node as Element;
    const tag = el.tagName.toLowerCase();
    const children = Array.from(el.childNodes).map(processNode).join('');
    
    switch (tag) {
      case 'h1': return `# ${children}\n\n`;
      case 'h2': return `## ${children}\n\n`;
      case 'h3': return `### ${children}\n\n`;
      case 'h4': return `#### ${children}\n\n`;
      case 'p': return `${children}\n\n`;
      case 'strong': return `**${children}**`;
      case 'code': 
        if (el.parentElement?.tagName.toLowerCase() === 'pre') return children;
        return `\`${children}\``;
      case 'pre': {
        const codeEl = el.querySelector('code');
        const lang = codeEl?.className.match(/language-(\w+)/)?.[1] || '';
        const code = codeEl?.textContent || el.textContent || '';
        return `\`\`\`${lang}\n${code}\n\`\`\`\n\n`;
      }
      case 'ul': return `${children}\n`;
      case 'li': return `- ${children}\n`;
      case 'a': return `[${children}](${el.getAttribute('href') || ''})`;
      case 'div':
        if (el.classList.contains('docs-code-block')) {
          const pre = el.querySelector('pre');
          return pre ? processNode(pre) : children;
        }
        if (el.classList.contains('docs-alert')) return `> ${children.trim()}\n\n`;
        return children;
      default: return children;
    }
  };
  
  return processNode(element).replace(/\n{3,}/g, '\n\n').trim();
}

export function DocsPage() {
  const [activeSection, setActiveSection] = useState<DocSection>('getting-started');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<DocContent[]>([]);
  const [copiedMarkdown, setCopiedMarkdown] = useState(false);

  useEffect(() => {
    Prism.highlightAll();
  }, [activeSection]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setSearchResults([]);
      return;
    }
    const query = searchQuery.toLowerCase();
    const results = sections.filter(s => 
      s.title.toLowerCase().includes(query) ||
      s.searchText.toLowerCase().includes(query)
    );
    setSearchResults(results);
  }, [searchQuery]);

  const filteredSections = searchQuery.trim() === '' 
    ? sections 
    : searchResults;

  return (
    <main className="docs-container">
      <aside className="docs-sidebar">
        <div className="docs-search">
          <input
            type="text"
            placeholder="Search docs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <nav className="docs-nav">
          {searchQuery.trim() !== '' && (
            <div style={{ padding: '0.5rem 1rem', fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '0.5rem' }}>
              {filteredSections.length} result{filteredSections.length !== 1 ? 's' : ''} for "{searchQuery}"
            </div>
          )}
          {filteredSections.length === 0 && searchQuery.trim() !== '' && (
            <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-dim)' }}>
              No sections found
            </div>
          )}
          {filteredSections.map(section => (
            <button
              key={section.id}
              className={`docs-nav-item ${activeSection === section.id ? 'active' : ''}`}
              onClick={() => setActiveSection(section.id)}
            >
              <span className="docs-nav-icon">{section.icon}</span>
              {section.title}
            </button>
          ))}
        </nav>
      </aside>

      <article className="docs-content">
        <div className="docs-content-header">
          <div className="docs-content-actions">
            <button 
              className="copy-markdown-btn"
              onClick={() => {
                const content = document.querySelector('.docs-section');
                if (content) {
                  const markdown = convertToMarkdown(content);
                  navigator.clipboard.writeText(markdown);
                  setCopiedMarkdown(true);
                  setTimeout(() => setCopiedMarkdown(false), 2000);
                }
              }}
              title="Copy this entire section as Markdown (for LLMs)"
            >
              {copiedMarkdown ? '✅ Copied!' : '📋 Copy as Markdown'}
            </button>
          </div>
        </div>
        {activeSection === 'getting-started' && <GettingStartedSection />}
        {activeSection === 'installation' && <InstallationSection />}
        {activeSection === 'typescript' && <TypeScriptSection />}
        {activeSection === 'python' && <PythonSection />}
        {activeSection === 'go' && <GoSection />}
        {activeSection === 'rust' && <RustSection />}
        {activeSection === 'cli' && <CLISection />}
        {activeSection === 'api' && <ApiSection />}
        {activeSection === 'examples' && <ExamplesSection />}
        {activeSection === 'comparison' && <ComparisonSection />}
      </article>
    </main>
  );
}

function GettingStartedSection() {
  return (
    <div className="docs-section">
      <h1>Getting Started with ZOON</h1>
      <p className="docs-intro">
        ZOON (Zero Overhead Object Notation) is a token-optimized text format designed to 
        minimize token consumption when transmitting structured data to Large Language Models (LLMs).
        Achieve <strong>40-60% token reduction</strong> compared to JSON.
      </p>

      <div className="docs-alert docs-alert-tip">
        <strong>Why ZOON?</strong> LLM tokens cost money. ZOON dramatically reduces your API costs 
        while maintaining 100% accuracy and lossless data transmission.
      </div>

      <h2>Key Features</h2>
      <ul className="docs-features">
        <li><strong>100% LLM Accuracy</strong> – Achieves perfect retrieval with self-explanatory structure</li>
        <li><strong>40-60% Token Reduction</strong> – Significantly cheaper than JSON for LLM workflows</li>
        <li><strong>JSON Compatible</strong> – Encodes same objects, arrays, and primitives with lossless round-trips</li>
        <li><strong>Two Encoding Modes</strong> – Tabular format for arrays, Inline format for objects</li>
        <li><strong>Auto-Increment IDs</strong> – Sequential IDs are omitted from output (i+ type)</li>
        <li><strong>Smart Enum Detection</strong> – Low-cardinality strings compressed automatically</li>
        <li><strong>Multi-Language Support</strong> – TypeScript, Python, Go, and Rust implementations</li>
      </ul>

      <h2>Quick Example</h2>
      <CodeBlock 
        language="json" 
        title="JSON (27 tokens)" 
        code={`[{"id":1,"name":"Alice","role":"admin"},{"id":2,"name":"Bob","role":"user"}]`} 
      />
      <CodeBlock 
        language="bash" 
        title="ZOON (14 tokens) – 48% savings" 
        code={`# id:i+ name:s role=admin|user
Alice admin
Bob user`} 
      />

      <h2>When to Use ZOON</h2>
      <div className="docs-grid">
        <div className="docs-card docs-card-good">
          <h4>✅ Use ZOON when:</h4>
          <ul>
            <li>Sending structured data to LLMs (ChatGPT, Claude, Gemini)</li>
            <li>Arrays contain uniform objects with repeated keys</li>
            <li>Token costs or context limits are a concern</li>
            <li>Deterministic, compact output is desired</li>
          </ul>
        </div>
        <div className="docs-card docs-card-bad">
          <h4>❌ Not intended for:</h4>
          <ul>
            <li>General API communication (use JSON)</li>
            <li>Maximum compression needs (use binary formats)</li>
            <li>Simple flat data (use CSV)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function InstallationSection() {
  return (
    <div className="docs-section">
      <h1>Installation</h1>
      
      <h2>TypeScript / JavaScript</h2>
      <CodeBlock language="bash" title="npm / bun / yarn" code={`npm install @zoon-format/zoon
# or
bun add @zoon-format/zoon
# or
yarn add @zoon-format/zoon`} />
      <CodeBlock language="typescript" title="Usage" code={`import { encode, decode } from '@zoon-format/zoon';

const data = [
  { id: 1, name: 'Alice', role: 'admin' },
  { id: 2, name: 'Bob', role: 'user' }
];

const encoded = encode(data);
console.log(encoded);
// # id:i+ name:s role=admin|user
// Alice admin
// Bob user

const decoded = decode(encoded);
// Identical to original - lossless!`} />

      <h2>Python</h2>
      <CodeBlock language="bash" title="pip / uv" code={`pip install zoon-format
# or
uv add zoon-format`} />
      <CodeBlock language="python" title="Usage" code={`import zoon

data = [
    {"id": 1, "name": "Alice", "role": "admin"},
    {"id": 2, "name": "Bob", "role": "user"}
]

encoded = zoon.encode(data)
decoded = zoon.decode(encoded)`} />

      <h2>Go</h2>
      <CodeBlock language="bash" title="go get" code={`go get github.com/zoon-format/zoon-go`} />
      <CodeBlock language="go" title="Usage" code={`import zoon "github.com/zoon-format/zoon-go"

type User struct {
    ID   int    \`json:"id"\`
    Name string \`json:"name"\`
    Role string \`json:"role"\`
}

users := []User{{1, "Alice", "admin"}, {2, "Bob", "user"}}
encoded, _ := zoon.Marshal(users)

var decoded []User
zoon.Unmarshal(encoded, &decoded)`} />

      <h2>Rust</h2>
      <CodeBlock language="toml" title="Cargo.toml" code={`[dependencies]
zoon-format = "1.0"
serde = { version = "1.0", features = ["derive"] }`} />
      <CodeBlock language="rust" title="Usage" code={`use zoon_format::{encode, decode};
use serde::{Serialize, Deserialize};

#[derive(Serialize, Deserialize)]
struct User {
    id: i32,
    name: String,
    role: String,
}

let users = vec![
    User { id: 1, name: "Alice".into(), role: "admin".into() },
];

let encoded = encode(&users)?;
let decoded: Vec<User> = decode(&encoded)?;`} />
    </div>
  );
}

function TypeScriptSection() {
  return (
    <div className="docs-section">
      <h1>TypeScript / JavaScript</h1>
      <p className="docs-intro">
        The core ZOON library for TypeScript and JavaScript. Zero dependencies, works in Node.js, Bun, Deno, and browsers.
      </p>

      <div className="docs-alert docs-alert-tip">
        <strong>Package:</strong> <a href="https://npmjs.com/package/@zoon-format/zoon" target="_blank" rel="noopener noreferrer">@zoon-format/zoon</a>
      </div>

      <h2>Installation</h2>
      <CodeBlock language="bash" title="npm / bun / yarn" code={`npm install @zoon-format/zoon
# or
bun add @zoon-format/zoon
# or  
yarn add @zoon-format/zoon`} />

      <h2>Basic Usage</h2>
      <CodeBlock language="typescript" title="encode & decode" code={`import { encode, decode, Zoon } from '@zoon-format/zoon';

const data = [
  { id: 1, name: 'Alice', role: 'admin', active: true },
  { id: 2, name: 'Bob', role: 'user', active: true },
  { id: 3, name: 'Carol', role: 'user', active: false }
];

const encoded = encode(data);
console.log(encoded);
// # id:i+ name:s role=admin|user active:b
// Alice admin 1
// Bob user 1
// Carol user 0

const decoded = decode(encoded);
// Returns identical array - lossless!

// Or use the Zoon class
const zoon = new Zoon();
const result = zoon.encode(data);`} />

      <h2>Class API - Zoon</h2>
      <CodeBlock language="typescript" title="Zoon class methods" code={`import { Zoon } from '@zoon-format/zoon';

// Static methods
Zoon.encode(data);     // Encode any value
Zoon.decode(string);   // Decode ZOON string

// Instance methods allow configuration
const zoon = new Zoon({ enumThreshold: 5 });
zoon.encode(data);
zoon.decode(string);`} />

      <h2>Inline Format (Objects)</h2>
      <CodeBlock language="typescript" title="Single objects use inline format" code={`const config = {
  server: { host: 'localhost', port: 3000, ssl: true },
  database: { driver: 'postgres', port: 5432 }
};

encode(config);
// server:{host=localhost port:3000 ssl:y} database:{driver=postgres port:5432}`} />

      <h2>Advanced: Custom Schema</h2>
      <CodeBlock language="typescript" title="Providing a schema" code={`import { encodeWithSchema, ZoonSchema } from '@zoon-format/zoon';

const schema: ZoonSchema = {
  fields: [
    { name: 'id', type: 'i+' },
    { name: 'status', type: 's', enum: ['pending', 'complete', 'failed'] }
  ]
};

encodeWithSchema(data, schema);`} />
    </div>
  );
}

function PythonSection() {
  return (
    <div className="docs-section">
      <h1>Python</h1>
      <p className="docs-intro">
        High-performance Python bindings for ZOON. Supports Python 3.10+ with async-compatible design.
      </p>

      <div className="docs-alert docs-alert-tip">
        <strong>Package:</strong> <a href="https://pypi.org/project/zoon-format/" target="_blank" rel="noopener noreferrer">zoon-format</a>
      </div>

      <h2>Installation</h2>
      <CodeBlock language="bash" title="pip / uv" code={`pip install zoon-format
# or
uv add zoon-format`} />

      <h2>Basic Usage</h2>
      <CodeBlock language="python" title="encode & decode" code={`import zoon

data = [
    {"id": 1, "name": "Alice", "role": "admin", "active": True},
    {"id": 2, "name": "Bob", "role": "user", "active": True},
    {"id": 3, "name": "Carol", "role": "user", "active": False}
]

encoded = zoon.encode(data)
print(encoded)
# # id:i+ name:s role=admin|user active:b
# Alice admin 1
# Bob user 1
# Carol user 0

decoded = zoon.decode(encoded)
# Returns identical list`} />

      <h2>Working with Pandas DataFrames</h2>
      <CodeBlock language="python" title="DataFrame integration" code={`import zoon
import pandas as pd

df = pd.DataFrame([
    {"name": "Alice", "score": 95},
    {"name": "Bob", "score": 87}
])

encoded = zoon.encode(df.to_dict('records'))
print(encoded)`} />

      <h2>CLI Usage</h2>
      <CodeBlock language="bash" title="Command line" code={`# Encode JSON file
python -m zoon encode data.json -o data.zoon

# Decode ZOON file
python -m zoon decode data.zoon -o output.json

# Show statistics
python -m zoon stats data.json`} />

      <h2>Error Handling</h2>
      <CodeBlock language="python" title="Exception handling" code={`from zoon import encode, decode, ZoonError

try:
    result = decode(invalid_string)
except ZoonError as e:
    print(f"Decode error: {e}")`} />
    </div>
  );
}

function GoSection() {
  return (
    <div className="docs-section">
      <h1>Go</h1>
      <p className="docs-intro">
        Native Go module with idiomatic Marshal/Unmarshal API. Supports struct tags for field mapping.
      </p>

      <div className="docs-alert docs-alert-tip">
        <strong>Package:</strong> <a href="https://github.com/zoon-format/zoon-go" target="_blank" rel="noopener noreferrer">github.com/zoon-format/zoon-go</a>
      </div>

      <h2>Installation</h2>
      <CodeBlock language="bash" title="go get" code={`go get github.com/zoon-format/zoon-go`} />

      <h2>Basic Usage</h2>
      <CodeBlock language="go" title="Marshal & Unmarshal" code={`package main

import (
    "fmt"
    zoon "github.com/zoon-format/zoon-go"
)

type User struct {
    ID     int    \`json:"id"\`
    Name   string \`json:"name"\`
    Role   string \`json:"role"\`
    Active bool   \`json:"active"\`
}

func main() {
    users := []User{
        {ID: 1, Name: "Alice", Role: "admin", Active: true},
        {ID: 2, Name: "Bob", Role: "user", Active: true},
    }

    encoded, err := zoon.Marshal(users)
    if err != nil {
        panic(err)
    }
    fmt.Println(string(encoded))
    // # id:i+ name:s role=admin|user active:b
    // Alice admin 1
    // Bob user 1

    var decoded []User
    err = zoon.Unmarshal(encoded, &decoded)
}`} />

      <h2>Working with Maps</h2>
      <CodeBlock language="go" title="Dynamic data" code={`data := []map[string]interface{}{
    {"id": 1, "name": "Alice"},
    {"id": 2, "name": "Bob"},
}

encoded, _ := zoon.Marshal(data)

var result []map[string]interface{}
zoon.Unmarshal(encoded, &result)`} />

      <h2>Encoder/Decoder Streaming</h2>
      <CodeBlock language="go" title="io.Reader/Writer support" code={`import "os"

file, _ := os.Create("output.zoon")
encoder := zoon.NewEncoder(file)
encoder.Encode(users)

file2, _ := os.Open("output.zoon")
decoder := zoon.NewDecoder(file2)
decoder.Decode(&users)`} />
    </div>
  );
}

function RustSection() {
  return (
    <div className="docs-section">
      <h1>Rust</h1>
      <p className="docs-intro">
        High-performance Rust crate with serde integration. Zero-copy parsing where possible.
      </p>

      <div className="docs-alert docs-alert-tip">
        <strong>Crate:</strong> <a href="https://crates.io/crates/zoon-format" target="_blank" rel="noopener noreferrer">zoon-format</a>
      </div>

      <h2>Installation</h2>
      <CodeBlock language="toml" title="Cargo.toml" code={`[dependencies]
zoon-format = "1.0"
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"`} />

      <h2>Basic Usage</h2>
      <CodeBlock language="rust" title="encode & decode" code={`use zoon_format::{encode, decode};
use serde::{Serialize, Deserialize};

#[derive(Debug, Serialize, Deserialize)]
struct User {
    id: i32,
    name: String,
    role: String,
    active: bool,
}

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let users = vec![
        User { id: 1, name: "Alice".into(), role: "admin".into(), active: true },
        User { id: 2, name: "Bob".into(), role: "user".into(), active: true },
    ];

    let encoded = encode(&users)?;
    println!("{}", encoded);
    // # id:i+ name:s role=admin|user active:b
    // Alice admin 1
    // Bob user 1

    let decoded: Vec<User> = decode(&encoded)?;
    Ok(())
}`} />

      <h2>Working with JSON Values</h2>
      <CodeBlock language="rust" title="Dynamic serde_json::Value" code={`use serde_json::json;
use zoon_format::encode;

let data = json!([
    {"id": 1, "name": "Alice"},
    {"id": 2, "name": "Bob"}
]);

let encoded = encode(&data)?;`} />

      <h2>Error Handling</h2>
      <CodeBlock language="rust" title="Result types" code={`use zoon_format::{decode, ZoonError};

match decode::<Vec<User>>(&input) {
    Ok(users) => println!("Decoded {} users", users.len()),
    Err(ZoonError::ParseError(msg)) => eprintln!("Parse error: {}", msg),
    Err(e) => eprintln!("Error: {:?}", e),
}`} />
    </div>
  );
}

function CLISection() {
  return (
    <div className="docs-section">
      <h1>Command Line Interface</h1>
      <p className="docs-intro">
        The ZOON CLI provides command-line tools for encoding, decoding, and analyzing ZOON files.
      </p>

      <div className="docs-alert docs-alert-tip">
        <strong>Package:</strong> <a href="https://npmjs.com/package/@zoon-format/cli" target="_blank" rel="noopener noreferrer">@zoon-format/cli</a>
      </div>

      <h2>Installation</h2>
      <CodeBlock language="bash" title="Global install" code={`npm install -g @zoon-format/cli
# or
bun install -g @zoon-format/cli`} />

      <h2>Basic Commands</h2>
      <CodeBlock language="bash" title="Encode JSON to ZOON" code={`# From file
zoon input.json -o output.zoon

# From stdin
cat data.json | zoon > output.zoon

# Pretty print to stdout
zoon input.json`} />

      <CodeBlock language="bash" title="Decode ZOON to JSON" code={`# From file
zoon -d input.zoon -o output.json

# From stdin
cat data.zoon | zoon -d > output.json`} />

      <h2>Statistics</h2>
      <CodeBlock language="bash" title="Show token savings" code={`zoon --stats input.json

# Output:
# JSON:  2,847 tokens
# ZOON:  1,573 tokens
# Saved: 1,274 tokens (44.8%)`} />

      <h2>Pipeline Examples</h2>
      <CodeBlock language="bash" title="Common workflows" code={`# Compress API response before sending to LLM
curl https://api.example.com/data | zoon | llm-cli

# Convert directory of JSON files
for f in *.json; do zoon "$f" -o "\${f%.json}.zoon"; done

# Validate and re-encode
zoon -d input.zoon | jq '.' | zoon > clean.zoon`} />

      <h2>Options Reference</h2>
      <div className="docs-table">
        <table>
          <thead>
            <tr><th>Flag</th><th>Description</th></tr>
          </thead>
          <tbody>
            <tr><td>-o, --output</td><td>Output file path</td></tr>
            <tr><td>-d, --decode</td><td>Decode ZOON to JSON</td></tr>
            <tr><td>--stats</td><td>Show token statistics</td></tr>
            <tr><td>--compact</td><td>Minimize output (no formatting)</td></tr>
            <tr><td>-h, --help</td><td>Show help message</td></tr>
            <tr><td>-v, --version</td><td>Show version</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ApiSection() {
  return (
    <div className="docs-section">
      <h1>API Reference</h1>

      <h2>encode(input, options?)</h2>
      <p>Encodes a JavaScript value into ZOON format string.</p>
      <div className="docs-table">
        <table>
          <thead>
            <tr><th>Parameter</th><th>Type</th><th>Description</th></tr>
          </thead>
          <tbody>
            <tr><td>input</td><td>unknown</td><td>Any JavaScript value (objects, arrays, primitives)</td></tr>
            <tr><td>options.schema</td><td>ZoonSchema</td><td>Optional custom schema</td></tr>
            <tr><td>options.inferEnums</td><td>boolean</td><td>Auto-detect enum columns (default: true)</td></tr>
            <tr><td>options.enumThreshold</td><td>number</td><td>Max unique values for enum detection (default: 10)</td></tr>
          </tbody>
        </table>
      </div>

      <h2>decode(zoonString)</h2>
      <p>Decodes a ZOON formatted string back into JavaScript objects.</p>
      <div className="docs-table">
        <table>
          <thead>
            <tr><th>Parameter</th><th>Type</th><th>Description</th></tr>
          </thead>
          <tbody>
            <tr><td>zoonString</td><td>string</td><td>ZOON formatted string to decode</td></tr>
            <tr><td>returns</td><td>DataRow[]</td><td>Array of decoded objects</td></tr>
          </tbody>
        </table>
      </div>

      <h2>Type Markers</h2>
      <div className="docs-table">
        <table>
          <thead>
            <tr><th>Marker</th><th>Type</th><th>Example</th></tr>
          </thead>
          <tbody>
            <tr><td>:s</td><td>String</td><td>name:s</td></tr>
            <tr><td>:i</td><td>Integer</td><td>count:i</td></tr>
            <tr><td>:i+</td><td>Auto-increment</td><td>id:i+</td></tr>
            <tr><td>:b</td><td>Boolean</td><td>active:b (values: 1/0)</td></tr>
            <tr><td>=x|y|z</td><td>Enum</td><td>status=pending|done</td></tr>
            <tr><td>:~</td><td>Null</td><td>value is ~</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ExamplesSection() {
  return (
    <div className="docs-section">
      <h1>Examples</h1>

      <h2>Tabular Format (Arrays)</h2>
      <p>Best for arrays of uniform objects. Uses header-based schema with row compression.</p>
      <CodeBlock language="typescript" title="Tabular format" code={`const employees = [
  { id: 1, name: 'Alice', department: 'Engineering', active: true },
  { id: 2, name: 'Bob', department: 'Engineering', active: true },
  { id: 3, name: 'Carol', department: 'Sales', active: false }
];

encode(employees);
// # id:i+ name:s department=Engineering|Sales active:b
// Alice Engineering 1
// Bob Engineering 1
// Carol Sales 0`} />

      <h2>Inline Format (Single Objects)</h2>
      <p>Best for configuration objects and nested structures.</p>
      <CodeBlock language="typescript" title="Inline format" code={`const config = {
  server: { host: 'localhost', port: 3000, ssl: true },
  database: { driver: 'postgres', host: 'db.example.com', port: 5432 }
};

encode(config);
// server:{host=localhost port:3000 ssl:y} database:{driver=postgres host=db.example.com port:5432}`} />

      <h2>Handling Nulls</h2>
      <CodeBlock language="typescript" title="Null handling" code={`const data = [
  { name: 'Alice', email: 'alice@example.com' },
  { name: 'Bob', email: null }
];

encode(data);
// # name:s email:s
// Alice alice@example.com
// Bob ~`} />
    </div>
  );
}

function ComparisonSection() {
  return (
    <div className="docs-section">
      <h1>Format Comparison</h1>
      <p>Benchmark results using real-world datasets from the ZOON Playground.</p>

      <h2>System Logs Dataset (500 rows)</h2>
      <p>This is our largest benchmark dataset, featuring structured log entries with 15 fields per row.</p>
      <div className="docs-table">
        <table>
          <thead>
            <tr><th>Format</th><th>Tokens (GPT-5)</th><th>Savings vs JSON</th></tr>
          </thead>
          <tbody>
            <tr className="docs-row-winner"><td><strong>ZOON</strong></td><td><strong>6,274</strong></td><td><strong>-60.0%</strong></td></tr>
            <tr><td>ZON</td><td>7,840</td><td>-50.0%</td></tr>
            <tr><td>TOON</td><td>8,630</td><td>-45.0%</td></tr>
            <tr><td>JSON</td><td>15,685</td><td>—</td></tr>
          </tbody>
        </table>
      </div>

      <div className="docs-alert docs-alert-tip">
        <strong>60% token reduction on large datasets!</strong> ZOON's header schema, auto-increment IDs, 
        indexed enums, and constant hoisting combine to dramatically reduce token usage while maintaining 100% data fidelity.
      </div>

      <h2>Why ZOON Wins</h2>
      <div className="docs-grid">
        <div className="docs-card">
          <h4>🎯 Header Schema</h4>
          <p>Column names defined once, not repeated per row like JSON.</p>
        </div>
        <div className="docs-card">
          <h4>⚡ Auto-Increment</h4>
          <p>Sequential IDs inferred automatically (i+ type), saving one value per row.</p>
        </div>
        <div className="docs-card">
          <h4>🏷️ Indexed Enums</h4>
          <p>Repeated strings like "INFO", "WARN" become 0, 1, 2 indices.</p>
        </div>
        <div className="docs-card">
          <h4>📌 Constant Hoisting</h4>
          <p>Identical values hoisted to header (@field=value syntax).</p>
        </div>
      </div>

      <h2>ZOON vs Other Formats</h2>
      <div className="docs-grid">
        <div className="docs-card">
          <h4>vs JSON</h4>
          <p>Up to 60% fewer tokens. Same data model, lossless round-trips.</p>
        </div>
        <div className="docs-card">
          <h4>vs ZON</h4>
          <p>20% fewer tokens with indexed enums and auto-increment support.</p>
        </div>
        <div className="docs-card">
          <h4>vs TOON</h4>
          <p>27% fewer tokens. Space delimiters + indexed enums more efficient.</p>
        </div>
        <div className="docs-card">
          <h4>vs CSV</h4>
          <p>Supports nested objects, nulls, booleans, arrays, and type annotations.</p>
        </div>
      </div>
    </div>
  );
}
