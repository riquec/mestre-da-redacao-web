"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Quote } from "lucide-react"

const testimonials = [
  {
    id: 1,
    name: "Raíssa Creston",
    role: "18 anos, Itaguaí",
    content:
      "Só tenho a agradecer. Ele é exigente, mas graças a isso, mesmo nunca tendo tirado uma nota acima de 800, consegui alcançar 900 na redação do Enem",
    avatar: "/images/raissa.jpeg",
    university: "Aluna 900 no ENEM",
  },
  {
    id: 2,
    name: "Leonardo Ferro",
    role: "19 anos, Campo Grande",
    content:
      "Consegui dissertar bem, consegui alcançar a nota que eu precisava, e graças a Deus, o curso que eu quero é peso 2 na redação",
    avatar: "/images/leonardo.jpeg",
    university: "de 400 para 820 em 2 semanas",
  }
]

export function TestimonialCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [autoplay, setAutoplay] = useState(true)
  const [itemsPerPage, setItemsPerPage] = useState(3)
  const totalPages = Math.ceil(testimonials.length / itemsPerPage)

  // Handle next slide
  const nextSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % totalPages)
  }

  // Handle previous slide
  const prevSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + totalPages) % totalPages)
  }

  // Responsive behavior
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setItemsPerPage(1)
      } else if (window.innerWidth < 1024) {
        setItemsPerPage(2)
      } else {
        setItemsPerPage(3)
      }
    }

    // Initial check
    handleResize()

    // Add event listener
    window.addEventListener("resize", handleResize)

    // Clean up
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  // Autoplay functionality
  useEffect(() => {
    if (!autoplay) return

    const interval = setInterval(() => {
      nextSlide()
    }, 5000)

    return () => clearInterval(interval)
  }, [currentIndex, autoplay, totalPages])

  // Pause autoplay on hover
  const handleMouseEnter = () => setAutoplay(false)
  const handleMouseLeave = () => setAutoplay(true)

  return (
    <div className="relative" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      <div className="flex justify-between absolute top-1/2 -translate-y-1/2 w-full px-4 z-10">
        <Button
          variant="outline"
          size="icon"
          className="rounded-full bg-white shadow-md hover:bg-blue-50 border-blue-200"
          onClick={prevSlide}
        >
          <ChevronLeft className="h-5 w-5 text-blue-700" />
          <span className="sr-only">Anterior</span>
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="rounded-full bg-white shadow-md hover:bg-blue-50 border-blue-200"
          onClick={nextSlide}
        >
          <ChevronRight className="h-5 w-5 text-blue-700" />
          <span className="sr-only">Próximo</span>
        </Button>
      </div>

      <div className="overflow-hidden">
        <div
          className="flex transition-transform duration-500 ease-in-out"
          style={{
            transform: `translateX(-${currentIndex * 100}%)`,
          }}
        >
          {Array.from({ length: totalPages }).map((_, pageIndex) => (
            <div key={pageIndex} className="min-w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {testimonials
                .slice(pageIndex * itemsPerPage, pageIndex * itemsPerPage + itemsPerPage)
                .map((testimonial) => (
                  <Card
                    key={testimonial.id}
                    className="bg-white shadow-md hover:shadow-lg transition-shadow h-full border-blue-200"
                  >
                    <CardContent className="p-6 flex flex-col h-full">
                      <div className="flex items-start mb-4">
                        <div className="bg-yellow-100 rounded-full p-2 mr-4 flex-shrink-0">
                          <Quote className="h-5 w-5 text-yellow-600" />
                        </div>
                        <p className="text-blue-800 italic">{testimonial.content}</p>
                      </div>
                      <div className="flex items-center mt-auto pt-6">
                        <Avatar className="h-12 w-12 mr-4 border-2 border-yellow-200">
                          <AvatarImage src={testimonial.avatar || "/placeholder.svg"} alt={testimonial.name} />
                          <AvatarFallback className="bg-blue-100 text-blue-700">
                            {testimonial.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h4 className="font-semibold text-blue-900">{testimonial.name}</h4>
                          <p className="text-sm text-blue-700">{testimonial.role}</p>
                          <p className="text-xs text-yellow-600 font-medium mt-1">{testimonial.university}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-center mt-6 gap-2">
        {Array.from({ length: totalPages }).map((_, index) => (
          <button
            key={index}
            className={`h-2 rounded-full transition-all ${
              currentIndex === index ? "w-6 bg-blue-600" : "w-2 bg-blue-200"
            }`}
            onClick={() => setCurrentIndex(index)}
            aria-label={`Ir para slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  )
}
