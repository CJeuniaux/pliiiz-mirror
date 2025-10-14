import { Toaster as Sonner, toast } from "sonner"
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      className="toaster group"
      position="top-center"
      duration={2500}
      style={{
        zIndex: 9999,
        top: 'max(env(safe-area-inset-top), 16px)',
      }}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast: "flex items-center gap-3 w-full max-w-md px-5 py-4 rounded-full shadow-lg font-poppins backdrop-blur-md bg-white/90 dark:bg-gray-800/90",
          success: "!bg-gradient-to-r from-[#ff7cab] to-[#ff9c6b] text-white",
          error: "!bg-gradient-to-r from-red-500 to-orange-500 text-white",
          info: "!bg-gradient-to-r from-blue-500 to-purple-500 text-white",
          warning: "!bg-gradient-to-r from-yellow-500 to-orange-500 text-white",
          title: "font-medium text-[15px] flex-1",
          description: "text-sm opacity-90",
          closeButton: "bg-white/20 hover:bg-white/30 text-white rounded-full",
        },
      }}
      icons={{
        success: <CheckCircle2 className="w-6 h-6 flex-shrink-0" />,
        error: <AlertCircle className="w-6 h-6 flex-shrink-0" />,
        info: <Info className="w-6 h-6 flex-shrink-0" />,
        warning: <AlertCircle className="w-6 h-6 flex-shrink-0" />,
      }}
      {...props}
    />
  )
}

export { Toaster, toast }
