"use client"

import { useState, useMemo } from "react"
import {
  UtensilsCrossed,
  ShoppingCart,
  Users,
  CreditCard,
  Search,
  Plus,
  Minus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Clock,
  X,
  FileText,
  Check,
  Download,
  AlertTriangle,
  ShoppingBag
} from "lucide-react"
import { formatCedula } from "@/lib/cedula"
import { exportCantinaLedgerToExcel } from "@/lib/exportExcel"
import DateRangeFilter from "../DateRangeFilter"
import {
  createFoodOrder,
  updateFoodCreditLimit,
  recordManualFoodPayment,
  approveFoodPayment,
  rejectFoodPayment,
  createFoodProduct,
  updateFoodProduct,
  toggleFoodProduct,
  deleteFoodProduct,
  createFoodCategory
} from "./actions"

interface CantinaHubProps {
  foodCategories: any[]
  foodProducts: any[]
  athletes: any[]
  creditAccounts: any[]
  foodOrders: any[]
  foodPayments: any[]
  teams: any[]
  sportCategories: any[]
  rates: any
  dateRangeStr: string
}

export default function CantinaHub({
  foodCategories,
  foodProducts,
  athletes,
  creditAccounts,
  foodOrders,
  foodPayments,
  teams,
  sportCategories,
  rates,
  dateRangeStr
}: CantinaHubProps) {
  const [activeTab, setActiveTab] = useState<"pos" | "catalog" | "credit" | "verification" | "reports">("pos")

  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null)
  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 4000)
  }

  const creditMap = useMemo(() => {
    const map = new Map<string, { balance: number; credit_limit: number }>()
    creditAccounts.forEach(acc => {
      map.set(acc.athlete_id, {
        balance: Number(acc.balance || 0),
        credit_limit: Number(acc.credit_limit || 50)
      })
    })
    return map
  }, [creditAccounts])

  const pendingPaymentsCount = useMemo(() => {
    return foodPayments.filter(p => p.status === "Pendiente").length
  }, [foodPayments])

  const athletesWithDebtCount = useMemo(() => {
    return creditAccounts.filter(acc => Number(acc.balance || 0) > 0).length
  }, [creditAccounts])

  // TAB 1: POS
  const [selectedAthleteId, setSelectedAthleteId] = useState<string | null>(null)
  const [athleteSearch, setAthleteSearch] = useState("")
  const [sportCatFilter, setSportCatFilter] = useState("")
  const [teamFilter, setTeamFilter] = useState("")
  const [foodCatFilter, setFoodCatFilter] = useState("")
  const [cart, setCart] = useState<{ [productId: string]: { product: any; quantity: number } }>({})
  const [orderNotes, setOrderNotes] = useState("")
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false)
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false)

  const selectedAthlete = useMemo(() => {
    return athletes.find(a => a.id === selectedAthleteId) || null
  }, [athletes, selectedAthleteId])

  const selectedAthleteCredit = useMemo(() => {
    if (!selectedAthleteId) return { balance: 0, credit_limit: 50 }
    return creditMap.get(selectedAthleteId) || { balance: 0, credit_limit: 50 }
  }, [selectedAthleteId, creditMap])

  const filteredAthletes = useMemo(() => {
    return athletes.filter(a => {
      const team = a.teams ? (Array.isArray(a.teams) ? a.teams[0] : a.teams) : null
      if (sportCatFilter && team?.category !== sportCatFilter) return false
      if (teamFilter && a.team_id !== teamFilter) return false
      if (athleteSearch.trim()) {
        const query = athleteSearch.toLowerCase().trim()
        const matchName = a.name?.toLowerCase().includes(query)
        const matchCedula = a.cedula?.toLowerCase().includes(query)
        return matchName || matchCedula
      }
      return true
    })
  }, [athletes, sportCatFilter, teamFilter, athleteSearch])

  const filteredFoodProducts = useMemo(() => {
    return foodProducts.filter(p => {
      if (foodCatFilter && p.category_id !== foodCatFilter) return false
      return true
    })
  }, [foodProducts, foodCatFilter])

  const addToCart = (product: any) => {
    setCart(prev => {
      const current = prev[product.id]
      const newQty = current ? current.quantity + 1 : 1
      return { ...prev, [product.id]: { product, quantity: newQty } }
    })
  }

  const removeFromCart = (productId: string) => {
    setCart(prev => {
      const current = prev[productId]
      if (!current) return prev
      if (current.quantity <= 1) {
        const copy = { ...prev }
        delete copy[productId]
        return copy
      }
      return { ...prev, [productId]: { ...current, quantity: current.quantity - 1 } }
    })
  }

  const clearCartItem = (productId: string) => {
    setCart(prev => {
      const copy = { ...prev }
      delete copy[productId]
      return copy
    })
  }

  const clearCart = () => {
    setCart({})
    setOrderNotes("")
  }

  const cartItemsArray = useMemo(() => Object.values(cart), [cart])
  const cartTotalUSD = useMemo(() => {
    return cartItemsArray.reduce((sum, item) => sum + (Number(item.product.price) * item.quantity), 0)
  }, [cartItemsArray])
  const cartTotalItemsCount = useMemo(() => {
    return cartItemsArray.reduce((sum, item) => sum + item.quantity, 0)
  }, [cartItemsArray])

  const projectedDebt = selectedAthleteCredit.balance + cartTotalUSD
  const isCreditExceeded = projectedDebt > selectedAthleteCredit.credit_limit

  const handleConfirmOrder = async () => {
    if (!selectedAthleteId) {
      showToast("Selecciona un atleta antes de confirmar la venta.", "error")
      return
    }
    if (cartItemsArray.length === 0) {
      showToast("Agrega al menos un producto a la comanda.", "error")
      return
    }

    setIsSubmittingOrder(true)
    try {
      const itemsPayload = cartItemsArray.map(item => ({
        productId: item.product.id,
        productName: item.product.name,
        quantity: item.quantity,
        unitPrice: Number(item.product.price),
        subtotal: Number((Number(item.product.price) * item.quantity).toFixed(2))
      }))

      const res = await createFoodOrder(selectedAthleteId, itemsPayload, orderNotes)
      if (res?.error) {
        showToast(res.error, "error")
      } else {
        showToast(`¡Venta de $${cartTotalUSD.toFixed(2)} asignada exitosamente a ${selectedAthlete?.name}!`, "success")
        clearCart()
        setIsMobileCartOpen(false)
      }
    } catch (err: any) {
      showToast("Error inesperado al registrar venta: " + err.message, "error")
    } finally {
      setIsSubmittingOrder(false)
    }
  }

  // TAB 2: CATÁLOGO
  const [isProductModalOpen, setIsProductModalOpen] = useState(false)
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<any | null>(null)
  const [newCategoryName, setNewCategoryName] = useState("")

  // TAB 3: CUENTAS POR COBRAR
  const [creditFilterDebtOnly, setCreditFilterDebtOnly] = useState(false)
  const [creditSearchQuery, setCreditSearchQuery] = useState("")
  const [adjustLimitAthlete, setAdjustLimitAthlete] = useState<any | null>(null)
  const [newLimitValue, setNewLimitValue] = useState<string>("50")
  const [manualPayAthlete, setManualPayAthlete] = useState<any | null>(null)
  const [manualPayAmount, setManualPayAmount] = useState<string>("")
  const [manualPayMethod, setManualPayMethod] = useState<string>("Efectivo en Dólares")
  const [manualPayNotes, setManualPayNotes] = useState<string>("")

  // TAB 4: VERIFICAR PAGOS
  const [verificationStatusFilter, setVerificationStatusFilter] = useState<"Pendiente" | "Completado" | "Rechazado" | "Todos">("Pendiente")
  const [viewingReceiptPayment, setViewingReceiptPayment] = useState<any | null>(null)
  const [rejectModalPayment, setRejectModalPayment] = useState<any | null>(null)
  const [rejectReason, setRejectReason] = useState("")

  // TAB 5: REPORTES
  const reportTotals = useMemo(() => {
    const totalVentas = foodOrders.reduce((sum, o) => sum + Number(o.total || 0), 0)
    const approvedPayments = foodPayments.filter(p => p.status === "Completado")
    const totalCobrado = approvedPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0)
    const totalDeuda = creditAccounts.reduce((sum, a) => sum + Number(a.balance || 0), 0)
    const ticketPromedio = foodOrders.length > 0 ? totalVentas / foodOrders.length : 0

    const methodMap = new Map<string, { count: number; total: number }>()
    approvedPayments.forEach(p => {
      const m = p.method || "No Especificado"
      const cur = methodMap.get(m) || { count: 0, total: 0 }
      cur.count += 1
      cur.total += Number(p.amount || 0)
      methodMap.set(m, cur)
    })

    const productRankMap = new Map<string, { name: string; quantity: number; total: number }>()
    foodOrders.forEach(o => {
      const items = o.food_order_items || []
      items.forEach((item: any) => {
        const cur = productRankMap.get(item.product_name) || { name: item.product_name, quantity: 0, total: 0 }
        cur.quantity += Number(item.quantity || 1)
        cur.total += Number(item.subtotal || 0)
        productRankMap.set(item.product_name, cur)
      })
    })

    return {
      totalVentas,
      totalCobrado,
      totalDeuda,
      ticketPromedio,
      methods: Array.from(methodMap.entries()).map(([method, data]) => ({ method, ...data })),
      topProducts: Array.from(productRankMap.values()).sort((a, b) => b.total - a.total)
    }
  }, [foodOrders, foodPayments, creditAccounts])

  const handleExportExcel = () => {
    const exportData = {
      dateRangeStr,
      totalVentas: reportTotals.totalVentas,
      totalCobrado: reportTotals.totalCobrado,
      totalDeuda: reportTotals.totalDeuda,
      orders: foodOrders.map(o => ({
        id: o.id,
        date: new Date(o.created_at).toLocaleString("es-VE"),
        athleteName: o.athletes?.name || "Atleta Desconocido",
        cedula: o.athletes?.cedula || "",
        teamName: o.athletes?.teams?.name || "Sin Equipo",
        itemsSummary: (o.food_order_items || []).map((it: any) => `${it.quantity}x ${it.product_name}`).join(", "),
        total: Number(o.total || 0),
        notes: o.notes
      })),
      payments: foodPayments.map(p => ({
        id: p.id,
        date: new Date(p.created_at).toLocaleString("es-VE"),
        athleteName: p.athletes?.name || "Atleta Desconocido",
        cedula: p.athletes?.cedula || "",
        method: p.method,
        amount: Number(p.amount || 0),
        transferredAmount: p.transferred_amount ? Number(p.transferred_amount) : null,
        exchangeRate: p.exchange_rate ? Number(p.exchange_rate) : null,
        reference: p.reference_number,
        status: p.status
      }))
    }
    exportCantinaLedgerToExcel(exportData)
  }

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 text-sm font-bold transition-all ${
          toast.type === "success" ? "bg-emerald-600 text-white" : "bg-red-600 text-white"
        }`}>
          {toast.type === "success" ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header Principal de Cantina */}
      <div className="bg-gradient-to-r from-kasa-vinotinto via-red-900 to-kasa-vinotinto text-white p-5 sm:p-7 rounded-3xl shadow-xl border border-red-950/40 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-64 h-64 bg-yellow-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2.5 mb-1.5">
              <div className="p-2 bg-white/10 rounded-xl">
                <UtensilsCrossed className="w-6 h-6 text-kasa-dorado" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Cantina KsaSports</h1>
            </div>
            <p className="text-white/80 text-xs sm:text-sm font-medium">
              Punto de Venta, asignación de consumo a atletas, cobranzas y reportes 100% independientes.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-black/30 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/10">
            <div className="text-right">
              <p className="text-[10px] text-gray-300 uppercase font-black tracking-widest">Tasa BCV del Día</p>
              <p className="text-base sm:text-lg font-black text-kasa-dorado">
                Bs. {Number(rates?.usd || 0).toLocaleString("es-VE", { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>

        {/* Pestañas de Navegación Responsiva */}
        <div className="mt-6 flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar snap-x border-t border-white/10 pt-4">
          <button
            onClick={() => setActiveTab("pos")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all snap-start ${
              activeTab === "pos"
                ? "bg-kasa-dorado text-kasa-vinotinto shadow-lg scale-105"
                : "bg-white/10 text-white/90 hover:bg-white/20"
            }`}
          >
            <ShoppingCart className="w-4 h-4" />
            Punto de Venta
          </button>

          <button
            onClick={() => setActiveTab("catalog")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all snap-start ${
              activeTab === "catalog"
                ? "bg-kasa-dorado text-kasa-vinotinto shadow-lg scale-105"
                : "bg-white/10 text-white/90 hover:bg-white/20"
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            Catálogo ({foodProducts.length})
          </button>

          <button
            onClick={() => setActiveTab("credit")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all snap-start ${
              activeTab === "credit"
                ? "bg-kasa-dorado text-kasa-vinotinto shadow-lg scale-105"
                : "bg-white/10 text-white/90 hover:bg-white/20"
            }`}
          >
            <CreditCard className="w-4 h-4" />
            Cuentas por Cobrar
            {athletesWithDebtCount > 0 && (
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                activeTab === "credit" ? "bg-kasa-vinotinto text-white" : "bg-red-500 text-white"
              }`}>
                {athletesWithDebtCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("verification")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all snap-start ${
              activeTab === "verification"
                ? "bg-kasa-dorado text-kasa-vinotinto shadow-lg scale-105"
                : "bg-white/10 text-white/90 hover:bg-white/20"
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            Verificar Pagos
            {pendingPaymentsCount > 0 && (
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black animate-pulse ${
                activeTab === "verification" ? "bg-kasa-vinotinto text-white" : "bg-amber-400 text-black"
              }`}>
                {pendingPaymentsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("reports")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all snap-start ${
              activeTab === "reports"
                ? "bg-kasa-dorado text-kasa-vinotinto shadow-lg scale-105"
                : "bg-white/10 text-white/90 hover:bg-white/20"
            }`}
          >
            <FileText className="w-4 h-4" />
            Reporte Financiero
          </button>
        </div>
      </div>

      {/* TAB 1: POS */}
      {activeTab === "pos" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start pb-20 lg:pb-0">
          <div className="lg:col-span-8 space-y-6">
            {/* SELECCIÓN DE ATLETA */}
            <div className="bg-white rounded-3xl p-4 sm:p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-kasa-vinotinto" />
                  <h2 className="font-black text-gray-900 text-base sm:text-lg">1. Seleccionar Atleta a Cobrar</h2>
                </div>
                {selectedAthlete && (
                  <button
                    onClick={() => setSelectedAthleteId(null)}
                    className="text-xs text-kasa-vinotinto font-bold hover:underline"
                  >
                    Cambiar
                  </button>
                )}
              </div>

              {selectedAthlete ? (
                <div className="bg-gradient-to-br from-amber-50 to-orange-50/40 p-4 rounded-2xl border border-amber-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-full bg-kasa-vinotinto text-kasa-dorado flex items-center justify-center font-black text-base shadow-sm shrink-0">
                      {selectedAthlete.avatar_url ? (
                        <img src={selectedAthlete.avatar_url} alt="" className="w-full h-full object-cover rounded-full" />
                      ) : (
                        selectedAthlete.name.substring(0, 2).toUpperCase()
                      )}
                    </div>
                    <div>
                      <h3 className="font-black text-gray-900 text-base leading-snug">{selectedAthlete.name}</h3>
                      <p className="text-xs text-gray-500 font-medium">
                        C.I: {formatCedula(selectedAthlete.cedula)} • {selectedAthlete.teams?.name || "Sin equipo"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 bg-white/80 backdrop-blur-xs p-2.5 rounded-xl border border-amber-200">
                    <div>
                      <span className="text-[10px] text-gray-400 font-bold uppercase block">Deuda Actual</span>
                      <span className="text-sm font-black text-red-600">
                        ${selectedAthleteCredit.balance.toFixed(2)}
                      </span>
                    </div>
                    <div className="w-px h-7 bg-gray-200"></div>
                    <div>
                      <span className="text-[10px] text-gray-400 font-bold uppercase block">Límite Crédito</span>
                      <span className="text-sm font-black text-gray-800">
                        ${selectedAthleteCredit.credit_limit.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <select
                      value={sportCatFilter}
                      onChange={(e) => setSportCatFilter(e.target.value)}
                      className="w-full text-xs font-semibold px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-kasa-dorado text-gray-700"
                    >
                      <option value="">Todas las Categorías</option>
                      {sportCategories.map((c: any) => (
                        <option key={c.id || c.name} value={c.name}>{c.name}</option>
                      ))}
                    </select>

                    <select
                      value={teamFilter}
                      onChange={(e) => setTeamFilter(e.target.value)}
                      className="w-full text-xs font-semibold px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-kasa-dorado text-gray-700"
                    >
                      <option value="">Todos los Equipos</option>
                      {teams.map((t: any) => (
                        <option key={t.id} value={t.id}>{t.name} ({t.category || "General"})</option>
                      ))}
                    </select>
                  </div>

                  <div className="relative">
                    <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Escribe el nombre o cédula del atleta..."
                      value={athleteSearch}
                      onChange={(e) => setAthleteSearch(e.target.value)}
                      className="w-full text-xs sm:text-sm pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-kasa-dorado text-gray-900"
                    />
                    {athleteSearch && (
                      <button onClick={() => setAthleteSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="max-h-56 overflow-y-auto divide-y divide-gray-100 border border-gray-100 rounded-2xl bg-gray-50/50">
                    {filteredAthletes.length === 0 ? (
                      <div className="p-4 text-center text-xs text-gray-400">
                        No se encontraron atletas con los filtros aplicados.
                      </div>
                    ) : (
                      filteredAthletes.slice(0, 30).map(athlete => {
                        const acc = creditMap.get(athlete.id) || { balance: 0, credit_limit: 50 }
                        const team = athlete.teams ? (Array.isArray(athlete.teams) ? athlete.teams[0] : athlete.teams) : null
                        return (
                          <button
                            key={athlete.id}
                            onClick={() => {
                              setSelectedAthleteId(athlete.id)
                              setAthleteSearch("")
                            }}
                            className="w-full p-2.5 px-3.5 flex items-center justify-between hover:bg-amber-50/80 transition-colors text-left group"
                          >
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-700 flex items-center justify-center text-xs font-bold shrink-0">
                                {athlete.name.substring(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <p className="text-xs font-black text-gray-900 group-hover:text-kasa-vinotinto">
                                  {athlete.name}
                                </p>
                                <p className="text-[10px] text-gray-400">
                                  C.I: {formatCedula(athlete.cedula)} {team ? `• ${team.name}` : ""}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className={`text-xs font-bold ${acc.balance > 0 ? "text-red-500" : "text-emerald-600"}`}>
                                {acc.balance > 0 ? `Debe $${acc.balance.toFixed(2)}` : "Solvente"}
                              </span>
                              <span className="block text-[9px] text-gray-400">Límite: ${acc.credit_limit}</span>
                            </div>
                          </button>
                        )
                      })
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* SELECCIÓN DE PRODUCTOS */}
            <div className="bg-white rounded-3xl p-4 sm:p-6 shadow-sm border border-gray-100">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-kasa-vinotinto" />
                  <h2 className="font-black text-gray-900 text-base sm:text-lg">2. Seleccionar Productos</h2>
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
                  <button
                    onClick={() => setFoodCatFilter("")}
                    className={`px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
                      foodCatFilter === "" ? "bg-kasa-vinotinto text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    Todos
                  </button>
                  {foodCategories.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setFoodCatFilter(cat.id)}
                      className={`px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
                        foodCatFilter === cat.id ? "bg-kasa-vinotinto text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>

              {filteredFoodProducts.length === 0 ? (
                <div className="text-center py-10 text-gray-400 text-xs">
                  No hay productos registrados en esta categoría. Puedes agregarlos en la pestaña <b>Catálogo</b>.
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {filteredFoodProducts.map(product => {
                    const cartItem = cart[product.id]
                    const qty = cartItem ? cartItem.quantity : 0
                    const isAvailable = product.is_available !== false

                    return (
                      <div
                        key={product.id}
                        className={`rounded-2xl p-3.5 border transition-all flex flex-col justify-between ${
                          !isAvailable
                            ? "bg-gray-50 border-gray-200 opacity-60"
                            : qty > 0
                            ? "bg-amber-50/60 border-kasa-dorado shadow-sm ring-1 ring-kasa-dorado"
                            : "bg-white border-gray-100 hover:border-gray-200 hover:shadow-xs"
                        }`}
                      >
                        <div>
                          <h4 className="font-bold text-gray-900 text-xs sm:text-sm leading-tight line-clamp-2">
                            {product.name}
                          </h4>
                          {product.description && (
                            <p className="text-[10px] text-gray-400 line-clamp-1 mt-0.5">{product.description}</p>
                          )}
                          <p className="text-base sm:text-lg font-black text-kasa-vinotinto mt-2">
                            ${Number(product.price).toFixed(2)}
                          </p>
                        </div>

                        <div className="mt-3">
                          {!isAvailable ? (
                            <span className="block text-center text-[10px] font-bold text-gray-400 py-2">
                              Agotado
                            </span>
                          ) : qty === 0 ? (
                            <button
                              onClick={() => addToCart(product)}
                              className="w-full min-h-[44px] flex items-center justify-center gap-1.5 bg-gray-100 hover:bg-kasa-dorado hover:text-kasa-vinotinto text-gray-800 font-bold text-xs rounded-xl transition-all active:scale-95 cursor-pointer"
                            >
                              <Plus className="w-4 h-4" />
                              Agregar
                            </button>
                          ) : (
                            <div className="flex items-center justify-between bg-white rounded-xl border border-gray-200 shadow-xs p-0.5">
                              <button
                                onClick={() => removeFromCart(product.id)}
                                className="w-10 h-10 min-h-[40px] flex items-center justify-center text-gray-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer active:scale-90"
                              >
                                <Minus className="w-4 h-4" />
                              </button>
                              <span className="font-black text-sm text-gray-900 px-2">{qty}</span>
                              <button
                                onClick={() => addToCart(product)}
                                className="w-10 h-10 min-h-[40px] flex items-center justify-center text-kasa-vinotinto hover:bg-amber-100 rounded-lg transition-colors cursor-pointer active:scale-90"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* LADO DERECHO: Ticket / Comanda (Desktop) */}
          <div className="hidden lg:block lg:col-span-4 sticky top-6">
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-5">
              <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-kasa-dorado" />
                  <h3 className="font-black text-gray-900 text-lg">Comanda Actual</h3>
                </div>
                {cartItemsArray.length > 0 && (
                  <button onClick={clearCart} className="text-xs text-gray-400 hover:text-red-500 transition-colors">
                    Vaciar
                  </button>
                )}
              </div>

              <div>
                <span className="text-[10px] text-gray-400 font-bold uppercase block mb-1">Cargar a la cuenta de:</span>
                {selectedAthlete ? (
                  <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100">
                    <p className="font-bold text-gray-900 text-sm">{selectedAthlete.name}</p>
                    <p className="text-xs text-gray-500">C.I: {formatCedula(selectedAthlete.cedula)}</p>
                  </div>
                ) : (
                  <div className="bg-amber-50/60 p-3 rounded-2xl border border-amber-200/80 text-xs text-amber-800 font-semibold flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    Selecciona un atleta en el paso 1.
                  </div>
                )}
              </div>

              <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                {cartItemsArray.length === 0 ? (
                  <div className="text-center py-8 text-xs text-gray-400">
                    No has agregado productos a la comanda.
                  </div>
                ) : (
                  cartItemsArray.map(item => (
                    <div key={item.product.id} className="flex items-center justify-between text-xs py-1.5 border-b border-gray-50">
                      <div className="flex-1 pr-2">
                        <p className="font-bold text-gray-800 line-clamp-1">{item.product.name}</p>
                        <p className="text-[10px] text-gray-400">
                          {item.quantity} x ${Number(item.product.price).toFixed(2)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-gray-900">
                          ${(Number(item.product.price) * item.quantity).toFixed(2)}
                        </span>
                        <button
                          onClick={() => clearCartItem(item.product.id)}
                          className="text-gray-300 hover:text-red-500"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {selectedAthlete && (
                <div className={`p-3 rounded-2xl text-xs border ${
                  isCreditExceeded
                    ? "bg-red-50 border-red-200 text-red-800"
                    : "bg-emerald-50 border-emerald-200 text-emerald-800"
                }`}>
                  <div className="flex justify-between font-bold">
                    <span>Deuda resultante:</span>
                    <span>${projectedDebt.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-[11px] opacity-80 mt-0.5">
                    <span>Límite asignado:</span>
                    <span>${selectedAthleteCredit.credit_limit.toFixed(2)}</span>
                  </div>
                  {isCreditExceeded && (
                    <p className="text-[10px] font-bold text-red-600 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      Esta venta supera el límite de crédito asignado.
                    </p>
                  )}
                </div>
              )}

              <div>
                <label className="text-[10px] text-gray-400 font-bold uppercase block mb-1">Notas del despacho (Opcional)</label>
                <input
                  type="text"
                  placeholder="Ej: Consumo juego sábado vs Águilas"
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl bg-gray-50 border border-gray-200"
                />
              </div>

              <div className="border-t border-gray-100 pt-4 space-y-3">
                <div className="flex justify-between items-baseline">
                  <span className="font-bold text-gray-500 text-sm">Total a Asignar:</span>
                  <span className="text-2xl font-black text-kasa-vinotinto">
                    ${cartTotalUSD.toFixed(2)}
                  </span>
                </div>

                <button
                  disabled={isSubmittingOrder || !selectedAthleteId || cartItemsArray.length === 0}
                  onClick={handleConfirmOrder}
                  className="w-full py-3.5 px-4 bg-gradient-to-r from-kasa-vinotinto to-red-950 hover:from-red-900 hover:to-black text-white font-black text-sm rounded-2xl transition-all shadow-lg disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isSubmittingOrder ? (
                    <Clock className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-kasa-dorado" />
                  )}
                  Confirmar Venta y Asignar Deuda
                </button>
              </div>
            </div>
          </div>

          {/* BARRA FIJA INFERIOR PARA MÓVILES */}
          <div className="lg:hidden fixed bottom-0 inset-x-0 bg-slate-900 text-white p-3 px-4 shadow-2xl border-t border-slate-800 z-40 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-kasa-dorado text-kasa-vinotinto flex items-center justify-center font-black relative">
                <ShoppingCart className="w-5 h-5" />
                {cartTotalItemsCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold">
                    {cartTotalItemsCount}
                  </span>
                )}
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Total Comanda</span>
                <span className="text-base font-black text-white">${cartTotalUSD.toFixed(2)} USD</span>
              </div>
            </div>

            <button
              onClick={() => setIsMobileCartOpen(true)}
              className="bg-gradient-to-r from-kasa-dorado to-yellow-500 text-kasa-vinotinto font-black text-xs px-5 py-2.5 rounded-xl shadow-md active:scale-95 transition-transform"
            >
              Revisar y Cobrar ➜
            </button>
          </div>

          {/* BOTTOM SHEET MODAL PARA MÓVILES */}
          {isMobileCartOpen && (
            <div className="lg:hidden fixed inset-0 z-50 bg-black/70 flex flex-col justify-end">
              <div className="bg-white rounded-t-3xl p-5 max-h-[85vh] overflow-y-auto space-y-4 shadow-2xl">
                <div className="flex justify-between items-center border-b pb-3">
                  <h3 className="font-black text-gray-900 text-lg flex items-center gap-2">
                    <ShoppingCart className="w-5 h-5 text-kasa-dorado" />
                    Resumen de Venta
                  </h3>
                  <button onClick={() => setIsMobileCartOpen(false)} className="p-1 text-gray-400 hover:text-gray-600">
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="bg-amber-50 p-3 rounded-2xl border border-amber-200">
                  <span className="text-[10px] text-gray-400 font-bold uppercase block">Cobrar a:</span>
                  {selectedAthlete ? (
                    <p className="font-black text-gray-900 text-sm">{selectedAthlete.name} (C.I: {formatCedula(selectedAthlete.cedula)})</p>
                  ) : (
                    <p className="text-xs text-red-600 font-bold">¡No has seleccionado ningún atleta!</p>
                  )}
                </div>

                <div className="divide-y divide-gray-100 max-h-48 overflow-y-auto">
                  {cartItemsArray.map(item => (
                    <div key={item.product.id} className="py-2 flex justify-between items-center text-xs">
                      <div>
                        <p className="font-bold text-gray-800">{item.product.name}</p>
                        <p className="text-[10px] text-gray-400">{item.quantity} x ${Number(item.product.price).toFixed(2)}</p>
                      </div>
                      <span className="font-black text-gray-900">
                        ${(Number(item.product.price) * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>

                <input
                  type="text"
                  placeholder="Notas de despacho (opcional)..."
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200"
                />

                <div className="flex justify-between items-center pt-2">
                  <span className="text-sm font-bold text-gray-500">Total a Asignar:</span>
                  <span className="text-2xl font-black text-kasa-vinotinto">${cartTotalUSD.toFixed(2)}</span>
                </div>

                <button
                  disabled={isSubmittingOrder || !selectedAthleteId || cartItemsArray.length === 0}
                  onClick={handleConfirmOrder}
                  className="w-full min-h-[48px] bg-kasa-vinotinto text-white font-black text-sm rounded-2xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmittingOrder ? <Clock className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  Confirmar y Asignar Deuda
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: CATÁLOGO */}
      {activeTab === "catalog" && (
        <div className="bg-white rounded-3xl p-4 sm:p-6 shadow-sm border border-gray-100 space-y-5">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h2 className="text-xl font-black text-gray-900">Catálogo de Alimentos y Bebidas</h2>
              <p className="text-xs text-gray-500">Administra los productos disponibles para la cantina con precios en USD.</p>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={() => setIsCategoryModalOpen(true)}
                className="flex-1 sm:flex-none text-xs font-bold px-3.5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 transition-colors flex items-center justify-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                Nueva Categoría
              </button>
              <button
                onClick={() => {
                  setEditingProduct(null)
                  setIsProductModalOpen(true)
                }}
                className="flex-1 sm:flex-none text-xs font-bold px-4 py-2 rounded-xl bg-kasa-vinotinto hover:bg-red-900 text-white transition-colors flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Plus className="w-3.5 h-3.5 text-kasa-dorado" />
                Nuevo Producto
              </button>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-gray-100">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-500 font-bold uppercase tracking-wider text-[10px] border-b border-gray-100">
                <tr>
                  <th className="p-3.5 px-4">Producto</th>
                  <th className="p-3.5">Categoría</th>
                  <th className="p-3.5">Precio USD</th>
                  <th className="p-3.5">Disponibilidad</th>
                  <th className="p-3.5 text-right px-4">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {foodProducts.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-gray-400">
                      No hay productos registrados en el catálogo de cantina.
                    </td>
                  </tr>
                ) : (
                  foodProducts.map(p => {
                    const isAvail = p.is_available !== false
                    return (
                      <tr key={p.id} className="hover:bg-gray-50/60 transition-colors">
                        <td className="p-3.5 px-4">
                          <p className="font-bold text-gray-900">{p.name}</p>
                          {p.description && <p className="text-[10px] text-gray-400">{p.description}</p>}
                        </td>
                        <td className="p-3.5">
                          <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 text-[10px] font-bold">
                            {p.food_categories?.name || "General"}
                          </span>
                        </td>
                        <td className="p-3.5 font-black text-kasa-vinotinto text-sm">
                          ${Number(p.price).toFixed(2)}
                        </td>
                        <td className="p-3.5">
                          <button
                            onClick={async () => {
                              await toggleFoodProduct(p.id, isAvail)
                              showToast(`Disponibilidad de "${p.name}" actualizada.`)
                            }}
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold cursor-pointer transition-colors ${
                              isAvail ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"
                            }`}
                          >
                            {isAvail ? "✓ Disponible" : "✕ Pausado"}
                          </button>
                        </td>
                        <td className="p-3.5 text-right px-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => {
                                setEditingProduct(p)
                                setIsProductModalOpen(true)
                              }}
                              className="text-xs font-bold text-kasa-vinotinto hover:underline p-1"
                            >
                              Editar
                            </button>
                            <button
                              onClick={async () => {
                                if (confirm(`¿Seguro que deseas eliminar "${p.name}"?`)) {
                                  await deleteFoodProduct(p.id)
                                  showToast("Producto eliminado.")
                                }
                              }}
                              className="text-gray-400 hover:text-red-500 p-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* MODAL NUEVO / EDITAR PRODUCTO */}
          {isProductModalOpen && (
            <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
                <div className="flex justify-between items-center border-b pb-3">
                  <h3 className="font-black text-gray-900 text-lg">
                    {editingProduct ? "Editar Producto" : "Nuevo Producto de Cantina"}
                  </h3>
                  <button onClick={() => setIsProductModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form
                  action={async (formData) => {
                    if (editingProduct) {
                      formData.append("id", editingProduct.id)
                      const res = await updateFoodProduct(formData)
                      if (res?.error) showToast(res.error, "error")
                      else showToast("Producto actualizado con éxito.")
                    } else {
                      const res = await createFoodProduct(formData)
                      if (res?.error) showToast(res.error, "error")
                      else showToast("Producto creado con éxito.")
                    }
                    setIsProductModalOpen(false)
                  }}
                  className="space-y-3.5"
                >
                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">Nombre del Producto</label>
                    <input
                      name="name"
                      required
                      defaultValue={editingProduct?.name || ""}
                      placeholder="Ej: Empanada Mechada"
                      className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-gray-200"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">Categoría</label>
                    <select
                      name="category_id"
                      defaultValue={editingProduct?.category_id || ""}
                      className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-gray-200"
                    >
                      <option value="">Sin Categoría</option>
                      {foodCategories.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">Precio ($ USD)</label>
                    <input
                      name="price"
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      defaultValue={editingProduct?.price || ""}
                      placeholder="Ej: 1.50"
                      className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-gray-200"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">Descripción (Opcional)</label>
                    <input
                      name="description"
                      defaultValue={editingProduct?.description || ""}
                      placeholder="Ej: Rellena con abundante queso"
                      className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-gray-200"
                    />
                  </div>

                  <div className="flex gap-2 pt-3">
                    <button
                      type="button"
                      onClick={() => setIsProductModalOpen(false)}
                      className="flex-1 py-2.5 rounded-xl bg-gray-100 text-gray-700 font-bold text-xs"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-2.5 rounded-xl bg-kasa-vinotinto text-white font-bold text-xs shadow-md"
                    >
                      Guardar
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* MODAL NUEVA CATEGORÍA */}
          {isCategoryModalOpen && (
            <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4">
                <div className="flex justify-between items-center border-b pb-3">
                  <h3 className="font-black text-gray-900 text-lg">Nueva Categoría</h3>
                  <button onClick={() => setIsCategoryModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Nombre (ej: Almuerzos, Postres)"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-gray-200"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => setIsCategoryModalOpen(false)}
                      className="flex-1 py-2.5 rounded-xl bg-gray-100 text-gray-700 font-bold text-xs"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={async () => {
                        const res = await createFoodCategory(newCategoryName)
                        if (res?.error) showToast(res.error, "error")
                        else {
                          showToast("Categoría creada.")
                          setNewCategoryName("")
                          setIsCategoryModalOpen(false)
                        }
                      }}
                      className="flex-1 py-2.5 rounded-xl bg-kasa-vinotinto text-white font-bold text-xs"
                    >
                      Crear
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: CUENTAS POR COBRAR */}
      {activeTab === "credit" && (
        <div className="bg-white rounded-3xl p-4 sm:p-6 shadow-sm border border-gray-100 space-y-5">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h2 className="text-xl font-black text-gray-900">Cuentas por Cobrar de Cantina</h2>
              <p className="text-xs text-gray-500">Monitorea la deuda activa, ajusta límites de crédito y registra cobros directos.</p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar por nombre o cédula..."
                  value={creditSearchQuery}
                  onChange={(e) => setCreditSearchQuery(e.target.value)}
                  className="w-full text-xs pl-9 pr-3 py-2 rounded-xl bg-gray-50 border border-gray-200"
                />
              </div>

              <button
                onClick={() => setCreditFilterDebtOnly(!creditFilterDebtOnly)}
                className={`text-xs font-bold px-3.5 py-2 rounded-xl border transition-colors ${
                  creditFilterDebtOnly
                    ? "bg-red-50 text-red-700 border-red-200"
                    : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                }`}
              >
                {creditFilterDebtOnly ? "✓ Solo con Deuda" : "Ver Todos"}
              </button>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-gray-100">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-500 font-bold uppercase tracking-wider text-[10px] border-b border-gray-100">
                <tr>
                  <th className="p-3.5 px-4">Atleta</th>
                  <th className="p-3.5">Equipo / Cat</th>
                  <th className="p-3.5">Deuda Pendiente</th>
                  <th className="p-3.5">Límite Crédito</th>
                  <th className="p-3.5">Crédito Libre</th>
                  <th className="p-3.5 text-right px-4">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {athletes
                  .filter(a => {
                    const acc = creditMap.get(a.id) || { balance: 0, credit_limit: 50 }
                    if (creditFilterDebtOnly && acc.balance <= 0) return false
                    if (creditSearchQuery.trim()) {
                      const q = creditSearchQuery.toLowerCase()
                      return a.name.toLowerCase().includes(q) || a.cedula.toLowerCase().includes(q)
                    }
                    return true
                  })
                  .map(athlete => {
                    const acc = creditMap.get(athlete.id) || { balance: 0, credit_limit: 50 }
                    const available = Math.max(0, acc.credit_limit - acc.balance)
                    const team = athlete.teams ? (Array.isArray(athlete.teams) ? athlete.teams[0] : athlete.teams) : null

                    return (
                      <tr key={athlete.id} className="hover:bg-gray-50/60 transition-colors">
                        <td className="p-3.5 px-4">
                          <p className="font-bold text-gray-900">{athlete.name}</p>
                          <p className="text-[10px] text-gray-400">C.I: {formatCedula(athlete.cedula)}</p>
                        </td>
                        <td className="p-3.5">
                          <span className="text-gray-700 font-medium">
                            {team ? `${team.name} (${team.category || "General"})` : "Sin Equipo"}
                          </span>
                        </td>
                        <td className="p-3.5">
                          <span className={`font-black text-sm ${acc.balance > 0 ? "text-red-600" : "text-emerald-600"}`}>
                            ${acc.balance.toFixed(2)}
                          </span>
                        </td>
                        <td className="p-3.5 font-bold text-gray-800">
                          ${acc.credit_limit.toFixed(2)}
                        </td>
                        <td className="p-3.5 font-medium text-gray-600">
                          ${available.toFixed(2)}
                        </td>
                        <td className="p-3.5 text-right px-4">
                          <div className="flex items-center justify-end gap-2">
                            {acc.balance > 0 && (
                              <button
                                onClick={() => {
                                  setManualPayAthlete(athlete)
                                  setManualPayAmount(acc.balance.toString())
                                }}
                                className="text-xs font-bold px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition-colors"
                              >
                                Cobrar en Mano
                              </button>
                            )}
                            <button
                              onClick={() => {
                                setAdjustLimitAthlete(athlete)
                                setNewLimitValue(acc.credit_limit.toString())
                              }}
                              className="text-xs font-bold px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
                            >
                              Límite
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
              </tbody>
            </table>
          </div>

          {adjustLimitAthlete && (
            <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4">
                <div className="flex justify-between items-center border-b pb-3">
                  <h3 className="font-black text-gray-900 text-base">Ajustar Límite de Crédito</h3>
                  <button onClick={() => setAdjustLimitAthlete(null)} className="text-gray-400 hover:text-gray-600">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-2">Atleta: <b>{adjustLimitAthlete.name}</b></p>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Nuevo Límite ($ USD)</label>
                  <input
                    type="number"
                    step="5"
                    min="0"
                    value={newLimitValue}
                    onChange={(e) => setNewLimitValue(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-gray-200"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setAdjustLimitAthlete(null)}
                    className="flex-1 py-2.5 rounded-xl bg-gray-100 text-gray-700 font-bold text-xs"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={async () => {
                      const res = await updateFoodCreditLimit(adjustLimitAthlete.id, Number(newLimitValue))
                      if (res?.error) showToast(res.error, "error")
                      else {
                        showToast("Límite actualizado.")
                        setAdjustLimitAthlete(null)
                      }
                    }}
                    className="flex-1 py-2.5 rounded-xl bg-kasa-vinotinto text-white font-bold text-xs"
                  >
                    Guardar
                  </button>
                </div>
              </div>
            </div>
          )}

          {manualPayAthlete && (
            <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4">
                <div className="flex justify-between items-center border-b pb-3">
                  <h3 className="font-black text-gray-900 text-base">Registrar Cobro en Mano</h3>
                  <button onClick={() => setManualPayAthlete(null)} className="text-gray-400 hover:text-gray-600">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-3">
                  <p className="text-xs text-gray-500">Atleta: <b>{manualPayAthlete.name}</b></p>
                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">Monto Cobrado ($ USD)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={manualPayAmount}
                      onChange={(e) => setManualPayAmount(e.target.value)}
                      className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-gray-200 font-bold text-emerald-700"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">Método de Pago</label>
                    <select
                      value={manualPayMethod}
                      onChange={(e) => setManualPayMethod(e.target.value)}
                      className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-gray-200"
                    >
                      <option value="Efectivo en Dólares">Efectivo en Dólares ($)</option>
                      <option value="Efectivo en Bolívares">Efectivo en Bolívares (Bs)</option>
                      <option value="Pago Móvil">Pago Móvil (Cobrado en sitio)</option>
                      <option value="Punto de Venta">Punto de Venta / Tarjeta</option>
                      <option value="Zelle">Zelle</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">Observación (Opcional)</label>
                    <input
                      type="text"
                      placeholder="Ej: Pagó completo en cantina"
                      value={manualPayNotes}
                      onChange={(e) => setManualPayNotes(e.target.value)}
                      className="w-full text-xs px-3.5 py-2 rounded-xl border border-gray-200"
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => setManualPayAthlete(null)}
                      className="flex-1 py-2.5 rounded-xl bg-gray-100 text-gray-700 font-bold text-xs"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={async () => {
                        const res = await recordManualFoodPayment(
                          manualPayAthlete.id,
                          Number(manualPayAmount),
                          manualPayMethod,
                          manualPayNotes
                        )
                        if (res?.error) showToast(res.error, "error")
                        else {
                          showToast("Abono registrado con éxito.")
                          setManualPayAthlete(null)
                        }
                      }}
                      className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs"
                    >
                      Confirmar Pago
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: VERIFICAR PAGOS */}
      {activeTab === "verification" && (
        <div className="bg-white rounded-3xl p-4 sm:p-6 shadow-sm border border-gray-100 space-y-5">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h2 className="text-xl font-black text-gray-900">Verificar Pagos Reportados</h2>
              <p className="text-xs text-gray-500">Audita los pagos de cantina reportados por los atletas y valida sus comprobantes.</p>
            </div>

            <div className="flex items-center gap-1.5 bg-gray-100 p-1 rounded-xl">
              {(["Pendiente", "Completado", "Rechazado", "Todos"] as const).map(status => (
                <button
                  key={status}
                  onClick={() => setVerificationStatusFilter(status)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    verificationStatusFilter === status
                      ? "bg-white text-kasa-vinotinto shadow-xs"
                      : "text-gray-500 hover:text-gray-900"
                  }`}
                >
                  {status === "Pendiente" && pendingPaymentsCount > 0 ? `Pendientes (${pendingPaymentsCount})` : status}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-gray-100">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-500 font-bold uppercase tracking-wider text-[10px] border-b border-gray-100">
                <tr>
                  <th className="p-3.5 px-4">Atleta</th>
                  <th className="p-3.5">Monto ($)</th>
                  <th className="p-3.5">Método / Ref</th>
                  <th className="p-3.5">Fecha</th>
                  <th className="p-3.5">Comprobante</th>
                  <th className="p-3.5">Estatus</th>
                  <th className="p-3.5 text-right px-4">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {foodPayments
                  .filter(p => {
                    if (verificationStatusFilter === "Todos") return true
                    return p.status === verificationStatusFilter
                  })
                  .map(payment => {
                    const isPending = payment.status === "Pendiente"
                    return (
                      <tr key={payment.id} className="hover:bg-gray-50/60 transition-colors">
                        <td className="p-3.5 px-4">
                          <p className="font-bold text-gray-900">{payment.athletes?.name || "Atleta"}</p>
                          <p className="text-[10px] text-gray-400">C.I: {formatCedula(payment.athletes?.cedula || "")}</p>
                        </td>
                        <td className="p-3.5">
                          <span className="font-black text-sm text-gray-900">
                            ${Number(payment.amount).toFixed(2)}
                          </span>
                          {payment.transferred_amount && (
                            <span className="block text-[10px] text-gray-400">
                              Bs. {Number(payment.transferred_amount).toLocaleString("es-VE", { minimumFractionDigits: 2 })}
                            </span>
                          )}
                        </td>
                        <td className="p-3.5">
                          <span className="font-bold text-gray-800 block">{payment.method}</span>
                          <span className="text-[10px] text-amber-600 font-mono">Ref: {payment.reference_number || "S/R"}</span>
                        </td>
                        <td className="p-3.5 text-[10px] text-gray-500">
                          {new Date(payment.created_at).toLocaleDateString("es-VE", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </td>
                        <td className="p-3.5">
                          {payment.receipt_url ? (
                            <button
                              onClick={() => setViewingReceiptPayment(payment)}
                              className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-[10px] flex items-center gap-1 transition-colors"
                            >
                              <FileText className="w-3 h-3" />
                              Ver Voucher
                            </button>
                          ) : (
                            <span className="text-gray-400 text-[10px]">Sin soporte</span>
                          )}
                        </td>
                        <td className="p-3.5">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            payment.status === "Completado"
                              ? "bg-emerald-100 text-emerald-800"
                              : payment.status === "Pendiente"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-red-100 text-red-800"
                          }`}>
                            {payment.status}
                          </span>
                        </td>
                        <td className="p-3.5 text-right px-4">
                          {isPending ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={async () => {
                                  const res = await approveFoodPayment(payment.id)
                                  if (res?.error) showToast(res.error, "error")
                                  else showToast("Pago aprobado y descontado de la deuda.")
                                }}
                                className="p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
                                title="Aprobar Pago"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  setRejectModalPayment(payment)
                                  setRejectReason("")
                                }}
                                className="p-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                                title="Rechazar Pago"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <span className="text-[10px] text-gray-400">Verificado</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
              </tbody>
            </table>
          </div>

          {viewingReceiptPayment && (
            <div
              className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-3 sm:p-4"
              onClick={() => setViewingReceiptPayment(null)}
            >
              <div
                className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex justify-between items-center p-4 border-b">
                  <h3 className="font-bold text-gray-900">Comprobante de Pago Cantina</h3>
                  <button onClick={() => setViewingReceiptPayment(null)} className="p-1 text-gray-400 hover:text-gray-600">
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="bg-slate-900 text-white p-3 px-4 flex flex-wrap items-center justify-between gap-2 text-xs border-b border-slate-800">
                  <div className="flex items-center gap-2 font-mono flex-wrap">
                    <span className="text-slate-400">Ref:</span>
                    <span className="font-bold text-amber-400 text-sm">{viewingReceiptPayment.reference_number || "S/R"}</span>
                    <span className="text-slate-600">|</span>
                    <span className="text-slate-400">Monto:</span>
                    <span className="font-bold text-white text-sm">${Number(viewingReceiptPayment.amount).toFixed(2)} USD</span>
                    {viewingReceiptPayment.transferred_amount && (
                      <span className="text-emerald-400 text-xs">
                        (Bs. {Number(viewingReceiptPayment.transferred_amount).toLocaleString("es-VE")})
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-400">
                    {new Date(viewingReceiptPayment.created_at).toLocaleDateString()}
                  </span>
                </div>

                <div className="flex-1 overflow-auto p-4 bg-gray-50 flex items-center justify-center">
                  <img
                    src={viewingReceiptPayment.receipt_url}
                    alt="Comprobante"
                    className="max-w-full max-h-[65vh] object-contain rounded-xl"
                  />
                </div>
              </div>
            </div>
          )}

          {rejectModalPayment && (
            <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4">
                <div className="flex justify-between items-center border-b pb-3">
                  <h3 className="font-black text-gray-900 text-base">Rechazar Pago</h3>
                  <button onClick={() => setRejectModalPayment(null)} className="text-gray-400 hover:text-gray-600">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Motivo del Rechazo</label>
                  <textarea
                    rows={3}
                    placeholder="Ej: La referencia no coincide en el banco o el monto está incompleto."
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    className="w-full text-xs p-3 rounded-xl border border-gray-200"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setRejectModalPayment(null)}
                    className="flex-1 py-2.5 rounded-xl bg-gray-100 text-gray-700 font-bold text-xs"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={async () => {
                      const res = await rejectFoodPayment(rejectModalPayment.id, rejectReason)
                      if (res?.error) showToast(res.error, "error")
                      else {
                        showToast("Pago marcado como rechazado.")
                        setRejectModalPayment(null)
                      }
                    }}
                    className="flex-1 py-2.5 rounded-xl bg-red-600 text-white font-bold text-xs"
                  >
                    Confirmar Rechazo
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 5: REPORTES FINANCIEROS */}
      {activeTab === "reports" && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-4 sm:p-6 shadow-sm border border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-xl font-black text-gray-900">Finanzas de Cantina</h2>
              <p className="text-xs text-gray-500">Período evaluado: <b>{dateRangeStr}</b></p>
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
              <DateRangeFilter />
              <button
                onClick={handleExportExcel}
                className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs transition-colors shadow-sm cursor-pointer"
              >
                <Download className="w-4 h-4" />
                Exportar Excel
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-white p-4 sm:p-5 rounded-3xl border border-gray-100 shadow-xs">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">
                Total Ventas
              </span>
              <p className="text-2xl sm:text-3xl font-black text-gray-900">
                ${reportTotals.totalVentas.toFixed(2)}
              </p>
              <span className="text-[10px] text-gray-400">{foodOrders.length} despachos realizados</span>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-3xl border border-gray-100 shadow-xs">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">
                Total Recaudado
              </span>
              <p className="text-2xl sm:text-3xl font-black text-emerald-600">
                ${reportTotals.totalCobrado.toFixed(2)}
              </p>
              <span className="text-[10px] text-emerald-600 font-bold">Cobrado y verificado</span>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-3xl border border-gray-100 shadow-xs">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">
                Cuentas por Cobrar
              </span>
              <p className="text-2xl sm:text-3xl font-black text-red-600">
                ${reportTotals.totalDeuda.toFixed(2)}
              </p>
              <span className="text-[10px] text-red-600 font-bold">{athletesWithDebtCount} atletas con deuda</span>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-3xl border border-gray-100 shadow-xs">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">
                Ticket Promedio
              </span>
              <p className="text-2xl sm:text-3xl font-black text-kasa-dorado">
                ${reportTotals.ticketPromedio.toFixed(2)}
              </p>
              <span className="text-[10px] text-gray-400">Por comanda asignada</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 space-y-4">
              <h3 className="font-black text-gray-900 text-sm uppercase tracking-wider">
                Recaudación por Método de Pago
              </h3>
              <div className="space-y-3">
                {reportTotals.methods.length === 0 ? (
                  <p className="text-xs text-gray-400">No hay pagos registrados en este período.</p>
                ) : (
                  reportTotals.methods.map(m => {
                    const pct = reportTotals.totalCobrado > 0 ? (m.total / reportTotals.totalCobrado) * 100 : 0
                    return (
                      <div key={m.method} className="space-y-1">
                        <div className="flex justify-between text-xs font-bold">
                          <span className="text-gray-700">{m.method} ({m.count})</span>
                          <span className="text-gray-900">${m.total.toFixed(2)} ({pct.toFixed(1)}%)</span>
                        </div>
                        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-kasa-dorado rounded-full" style={{ width: `${pct}%` }}></div>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>

            <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 space-y-4">
              <h3 className="font-black text-gray-900 text-sm uppercase tracking-wider">
                Top Productos Más Consumidos
              </h3>
              <div className="divide-y divide-gray-100 max-h-60 overflow-y-auto">
                {reportTotals.topProducts.length === 0 ? (
                  <p className="text-xs text-gray-400">No hay ventas registradas en este período.</p>
                ) : (
                  reportTotals.topProducts.map((prod, idx) => (
                    <div key={prod.name} className="py-2 flex justify-between items-center text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center font-black text-[10px]">
                          {idx + 1}
                        </span>
                        <div>
                          <p className="font-bold text-gray-900">{prod.name}</p>
                          <p className="text-[10px] text-gray-400">{prod.quantity} unidades despachadas</p>
                        </div>
                      </div>
                      <span className="font-black text-kasa-vinotinto">${prod.total.toFixed(2)}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
