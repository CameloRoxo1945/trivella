"use client"

import { useState, useEffect } from "react"
import { Moon, Sun, Download, FileText, RotateCcw, Copy, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"

const PAUSE_TIME = 0.9

interface Block {
  content: string
  startTime: number
  endTime: number
  charCount: number
  wordCount: number
}

export default function OtimizadorGold() {
  const [darkMode, setDarkMode] = useState(true)
  const [fileName, setFileName] = useState("")
  const [charCount, setCharCount] = useState(490)
  const [textInput, setTextInput] = useState("")
  const [speed, setSpeed] = useState(1)
  const [readingRate, setReadingRate] = useState(14)
  const [blocks, setBlocks] = useState<Block[]>([])
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }, [darkMode])

  const formatText = (text: string): string => {
    text = text.replace(/"/g, "'")
    text = text.replace(/«/g, "'").replace(/»/g, "'")
    text = text.replace(/\n/g, " ")
    text = text.replace(/([a-zA-Z])([.,!?;:])/g, "$1 $2")
    text = text.replace(/([.,!?;:])([a-zA-Z])/g, "$1 $2")
    text = text.replace(/([.,!?;:])([.,!?;:])/g, "$1 $2").replace(/([.,!?;:])\s([.,!?;:])/g, "$1$2")
    text = text.replace(/\. \. \./g, "...")
    text = text.replace(/(\B')(?=\w)|(?<=\w)('\B)/g, "$1 $2")
    return text
  }

  const splitTextIntoBlocks = (text: string, maxLength: number): string[] => {
    const blocks: string[] = []
    let currentBlock = ""
    const sentences = text.split(/(?<=\.|\?|!)(?=\s)/g)

    for (let i = 0; i < sentences.length; i++) {
      const sentence = sentences[i].trim()
      if (currentBlock.length + sentence.length + 1 <= maxLength) {
        currentBlock += sentence + " "
      } else {
        if (currentBlock.trim().length > 0) {
          blocks.push(currentBlock.trim())
        }
        currentBlock = sentence + " "
      }
    }

    if (currentBlock.trim().length > 0) {
      blocks.push(currentBlock.trim())
    }

    return blocks
  }

  const divideTextByChars = () => {
    if (charCount <= 0) {
      alert("Por favor, insira um número válido de caracteres.")
      return
    }

    const formattedText = formatText(textInput)
    const textBlocks = splitTextIntoBlocks(formattedText, charCount)

    let currentTime = 0
    const newBlocks: Block[] = textBlocks.map((block) => {
      const duration = block.length / readingRate
      const startTime = currentTime
      const endTime = currentTime + duration
      currentTime = endTime + PAUSE_TIME

      return {
        content: block,
        startTime,
        endTime,
        charCount: block.length,
        wordCount: block.split(/\s+/).filter((word) => word.length > 0).length,
      }
    })

    setBlocks(newBlocks)
  }

  const formatTimestamp = (seconds: number): string => {
    const date = new Date(seconds * 1000)
    const hours = String(date.getUTCHours()).padStart(2, "0")
    const minutes = String(date.getUTCMinutes()).padStart(2, "0")
    const secs = String(date.getUTCSeconds()).padStart(2, "0")
    const millis = String(date.getUTCMilliseconds()).padStart(3, "0")
    return `${hours}:${minutes}:${secs},${millis}`
  }

  const adjustTimestamp = (timestamp: string, speed: number): string => {
    const parts = timestamp.split(":")
    const hours = Number.parseInt(parts[0])
    const minutes = Number.parseInt(parts[1])
    const secondsParts = parts[2].split(",")
    const seconds = Number.parseInt(secondsParts[0])
    const milliseconds = Number.parseInt(secondsParts[1])

    let totalMilliseconds = ((hours * 3600 + minutes * 60 + seconds) * 1000 + milliseconds) * speed

    const newHours = Math.floor(totalMilliseconds / 3600000)
    totalMilliseconds %= 3600000
    const newMinutes = Math.floor(totalMilliseconds / 60000)
    totalMilliseconds %= 60000
    const newSeconds = Math.floor(totalMilliseconds / 1000)
    const newMilliseconds = totalMilliseconds % 1000

    return `${String(newHours).padStart(2, "0")}:${String(newMinutes).padStart(2, "0")}:${String(newSeconds).padStart(2, "0")},${String(newMilliseconds).padStart(3, "0")}`
  }

  const exportToSrt = () => {
    let srtContent = ""
    blocks.forEach((block, index) => {
      const startTime = adjustTimestamp(formatTimestamp(block.startTime), speed)
      const endTime = adjustTimestamp(formatTimestamp(block.endTime), speed)
      srtContent += `${index + 1}\n${startTime} --> ${endTime}\n${block.content}\n\n`
    })

    const blob = new Blob([srtContent.trim()], { type: "text/srt" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${fileName || "subtitles"}.srt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const exportToPdf = async () => {
    const { jsPDF } = await import("jspdf")
    const doc = new jsPDF()
    const name = fileName || "documento"

    if (blocks.length > 0) {
      let y = 10

      blocks.forEach((block, index) => {
        const blockInfo = `Bloco ${index + 1}\n${block.content}`
        const lines = doc.splitTextToSize(blockInfo, 180)

        lines.forEach((line: string) => {
          doc.text(line, 10, y)
          y += 10

          if (y > 270) {
            doc.addPage()
            y = 10
          }
        })

        y += 10
      })
    } else {
      const lines = doc.splitTextToSize(textInput, 180)
      let y = 10

      lines.forEach((line: string) => {
        doc.text(line, 10, y)
        y += 10

        if (y > 270) {
          doc.addPage()
          y = 10
        }
      })
    }

    doc.save(`${name}.pdf`)
  }

  const resetForm = () => {
    setFileName("")
    setCharCount(490)
    setTextInput("")
    setBlocks([])
    setSpeed(1)
    setReadingRate(14)
  }

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text)
    setCopiedIndex(index)
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  const totalChars = textInput.length
  const totalWords = textInput.split(/\s+/).filter((word) => word.length > 0).length

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Otimizador Gold
          </h1>
          <Button variant="outline" size="icon" onClick={() => setDarkMode(!darkMode)} className="rounded-full">
            {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
        </div>

        {/* Form */}
        <Card className="mb-8">
          <CardContent className="pt-6 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="fileName">Nome do arquivo</Label>
              <Input
                id="fileName"
                placeholder="Digite o nome do arquivo"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="charCount">Dividir em quantos caracteres</Label>
              <Input
                id="charCount"
                type="number"
                value={charCount}
                onChange={(e) => setCharCount(Number(e.target.value))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="textInput">Texto para otimizar</Label>
              <Textarea
                id="textInput"
                rows={10}
                placeholder="Insira o texto aqui..."
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                className="resize-none"
              />
              {textInput && (
                <p className="text-sm text-muted-foreground">
                  Total: {totalChars} caracteres | {totalWords} palavras
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="speed">Espaçamento entre áudios: {speed.toFixed(1)}x</Label>
                <Slider
                  id="speed"
                  min={0.5}
                  max={2}
                  step={0.1}
                  value={[speed]}
                  onValueChange={(value) => setSpeed(value[0])}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="readingRate">Caracteres por segundo: {readingRate} c/s</Label>
                <Slider
                  id="readingRate"
                  min={10}
                  max={50}
                  step={1}
                  value={[readingRate]}
                  onValueChange={(value) => setReadingRate(value[0])}
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button onClick={divideTextByChars} className="flex-1 min-w-[200px]">
                <FileText className="mr-2 h-4 w-4" />
                Dividir por Caracteres
              </Button>
              <Button onClick={resetForm} variant="outline" className="flex-1 min-w-[200px] bg-transparent">
                <RotateCcw className="mr-2 h-4 w-4" />
                Redefinir
              </Button>
            </div>

            {blocks.length > 0 && (
              <div className="flex flex-wrap gap-3 pt-4 border-t">
                <Button onClick={exportToSrt} variant="secondary" className="flex-1 min-w-[200px]">
                  <Download className="mr-2 h-4 w-4" />
                  Exportar para SRT
                </Button>
                <Button onClick={exportToPdf} variant="secondary" className="flex-1 min-w-[200px]">
                  <Download className="mr-2 h-4 w-4" />
                  Exportar para PDF
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Blocks */}
        {blocks.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold">Blocos Gerados ({blocks.length})</h2>
            {blocks.map((block, index) => (
              <Card key={index} className="relative">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-lg">Bloco {index + 1}</h3>
                      <p className="text-sm text-muted-foreground">
                        {block.charCount} caracteres | {block.wordCount} palavras
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatTimestamp(block.startTime)} → {formatTimestamp(block.endTime)}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant={copiedIndex === index ? "default" : "outline"}
                      onClick={() => copyToClipboard(block.content, index)}
                    >
                      {copiedIndex === index ? (
                        <>
                          <Check className="mr-2 h-4 w-4" />
                          Copiado
                        </>
                      ) : (
                        <>
                          <Copy className="mr-2 h-4 w-4" />
                          Copiar
                        </>
                      )}
                    </Button>
                  </div>
                  <p className="text-sm leading-relaxed">{block.content}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Footer */}
        <p className="text-center mt-12 text-lg text-primary font-medium">
          O sonho é a coisa mais real que Existe! Gratidão
        </p>
      </div>
    </div>
  )
}
