// State
let blocks = []
let isDarkMode = localStorage.getItem("theme") === "dark"

// DOM Elements
const themeToggle = document.getElementById("themeToggle")
const sunIcon = document.querySelector(".sun-icon")
const moonIcon = document.querySelector(".moon-icon")
const inputText = document.getElementById("inputText")
const charCount = document.getElementById("charCount")
const wordCount = document.getElementById("wordCount")
const charLimit = document.getElementById("charLimit")
const readingRate = document.getElementById("readingRate")
const speed = document.getElementById("speed")
const optimizeBtn = document.getElementById("optimizeBtn")
const exportSrtBtn = document.getElementById("exportSrtBtn")
const exportPdfBtn = document.getElementById("exportPdfBtn")
const resetBtn = document.getElementById("resetBtn")
const outputSection = document.getElementById("outputSection")
const blocksContainer = document.getElementById("blocksContainer")

// Initialize theme
function initTheme() {
  if (isDarkMode) {
    document.documentElement.setAttribute("data-theme", "dark")
    sunIcon.classList.add("hidden")
    moonIcon.classList.remove("hidden")
  } else {
    document.documentElement.removeAttribute("data-theme")
    sunIcon.classList.remove("hidden")
    moonIcon.classList.add("hidden")
  }
}

// Toggle theme
themeToggle.addEventListener("click", () => {
  isDarkMode = !isDarkMode
  localStorage.setItem("theme", isDarkMode ? "dark" : "light")
  initTheme()
})

// Update character and word count
inputText.addEventListener("input", () => {
  const text = inputText.value
  const chars = text.length
  const words = text.trim() ? text.trim().split(/\s+/).length : 0

  charCount.textContent = `${chars} caracteres`
  wordCount.textContent = `${words} palavras`
})

// Format text
function formatText(text) {
  return text
    .replace(/"/g, "")
    .replace(/\s+/g, " ")
    .replace(/\s+([.,!?;:])/g, "$1")
    .replace(/([.,!?;:])\s*/g, "$1 ")
    .trim()
}

// Split text into blocks
function splitIntoBlocks(text, limit) {
  const formatted = formatText(text)
  const blocks = []
  let currentBlock = ""
  const words = formatted.split(" ")

  for (const word of words) {
    if ((currentBlock + " " + word).trim().length <= limit) {
      currentBlock = (currentBlock + " " + word).trim()
    } else {
      if (currentBlock) blocks.push(currentBlock)
      currentBlock = word
    }
  }

  if (currentBlock) blocks.push(currentBlock)
  return blocks
}

// Format time for SRT
function formatTime(seconds) {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)
  const ms = Math.floor((seconds % 1) * 1000)

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")},${String(ms).padStart(3, "0")}`
}

// Calculate timestamps
function calculateTimestamps(blocks, rate, speedMultiplier) {
  let currentTime = 0
  const result = []

  for (const block of blocks) {
    const duration = block.length / rate
    const adjustedDuration = duration / speedMultiplier
    const endTime = currentTime + adjustedDuration

    result.push({
      text: block,
      start: currentTime,
      end: endTime,
      startFormatted: formatTime(currentTime),
      endFormatted: formatTime(endTime),
    })

    currentTime = endTime
  }

  return result
}

// Render blocks
function renderBlocks() {
  blocksContainer.innerHTML = ""

  blocks.forEach((block, index) => {
    const blockCard = document.createElement("div")
    blockCard.className = "block-card"

    const chars = block.text.length
    const words = block.text.trim().split(/\s+/).length

    blockCard.innerHTML = `
      <div class="block-header">
        <span class="block-title">Bloco ${index + 1}</span>
        <div class="block-info">
          <span>${block.startFormatted} → ${block.endFormatted}</span>
        </div>
      </div>
      <div class="block-content">${block.text}</div>
      <div class="block-footer">
        <div class="block-stats">
          <span>${chars} caracteres</span>
          <span>${words} palavras</span>
        </div>
        <button class="copy-btn" data-index="${index}">Copiar</button>
      </div>
    `

    blocksContainer.appendChild(blockCard)
  })

  // Add copy event listeners
  document.querySelectorAll(".copy-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const index = Number.parseInt(e.target.dataset.index)
      navigator.clipboard.writeText(blocks[index].text)
      e.target.textContent = "Copiado!"
      setTimeout(() => {
        e.target.textContent = "Copiar"
      }, 2000)
    })
  })

  outputSection.classList.remove("hidden")
}

// Optimize text
optimizeBtn.addEventListener("click", () => {
  const text = inputText.value.trim()
  if (!text) {
    alert("Por favor, insira um texto para otimizar.")
    return
  }

  const limit = Number.parseInt(charLimit.value)
  const rate = Number.parseFloat(readingRate.value)
  const speedMultiplier = Number.parseFloat(speed.value)

  const textBlocks = splitIntoBlocks(text, limit)
  blocks = calculateTimestamps(textBlocks, rate, speedMultiplier)

  renderBlocks()
})

// Export SRT
exportSrtBtn.addEventListener("click", () => {
  if (blocks.length === 0) {
    alert("Por favor, otimize o texto primeiro.")
    return
  }

  let srtContent = ""
  blocks.forEach((block, index) => {
    srtContent += `${index + 1}\n`
    srtContent += `${block.startFormatted} --> ${block.endFormatted}\n`
    srtContent += `${block.text}\n\n`
  })

  const blob = new Blob([srtContent], { type: "text/plain;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = "legendas.srt"
  a.click()
  URL.revokeObjectURL(url)
})

// Export PDF
exportPdfBtn.addEventListener("click", () => {
  if (blocks.length === 0) {
    alert("Por favor, otimize o texto primeiro.")
    return
  }

  const { jsPDF } = window.jspdf
  const doc = new jsPDF()

  doc.setFont("helvetica", "bold")
  doc.setFontSize(18)
  doc.setTextColor(212, 175, 55)
  doc.text("Otimizador Gold", 20, 20)

  doc.setFont("helvetica", "normal")
  doc.setFontSize(10)
  doc.setTextColor(0, 0, 0)

  let yPosition = 35
  const pageHeight = doc.internal.pageSize.height
  const margin = 20
  const lineHeight = 7

  blocks.forEach((block, index) => {
    // Check if we need a new page
    if (yPosition > pageHeight - 40) {
      doc.addPage()
      yPosition = 20
    }

    // Block header
    doc.setFont("helvetica", "bold")
    doc.setTextColor(212, 175, 55)
    doc.text(`Bloco ${index + 1}`, margin, yPosition)
    yPosition += lineHeight

    doc.setFont("helvetica", "normal")
    doc.setFontSize(8)
    doc.setTextColor(100, 100, 100)
    doc.text(`${block.startFormatted} → ${block.endFormatted}`, margin, yPosition)
    yPosition += lineHeight

    // Block content
    doc.setFontSize(10)
    doc.setTextColor(0, 0, 0)
    const lines = doc.splitTextToSize(block.text, 170)
    lines.forEach((line) => {
      if (yPosition > pageHeight - 20) {
        doc.addPage()
        yPosition = 20
      }
      doc.text(line, margin, yPosition)
      yPosition += lineHeight
    })

    yPosition += 5 // Space between blocks
  })

  doc.save("otimizador-gold.pdf")
})

// Reset
resetBtn.addEventListener("click", () => {
  if (confirm("Tem certeza que deseja redefinir tudo?")) {
    inputText.value = ""
    charLimit.value = "490"
    readingRate.value = "15"
    speed.value = "1"
    blocks = []
    blocksContainer.innerHTML = ""
    outputSection.classList.add("hidden")
    charCount.textContent = "0 caracteres"
    wordCount.textContent = "0 palavras"
  }
})

// Initialize
initTheme()
