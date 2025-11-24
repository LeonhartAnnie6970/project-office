// "use client"

// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
// import { Badge } from "@/components/ui/badge"
// import { AdminTicketDetail } from "./admin-ticket-detail"

// interface Ticket {
//   id: number
//   title: string
//   description: string
//   category: string
//   status: string
//   created_at: string
//   name: string
//   divisi?: string
//   image_user_url?: string
//   image_admin_url?: string
//   image_admin_uploaded_at?: string
// }

// interface AdminTicketsByStatusProps {
//   tickets: Ticket[]
//   onStatusUpdate: (ticketId: number, newStatus: string) => Promise<void>
//   updatingStatus: Record<number, boolean>
// }

// export function AdminTicketsByStatus({ tickets, onStatusUpdate, updatingStatus }: AdminTicketsByStatusProps) {
//   const newTickets = tickets.filter((t) => t.status === "new")
//   const inProgressTickets = tickets.filter((t) => t.status === "in_progress")
//   const resolvedTickets = tickets.filter((t) => t.status === "resolved")

//   const TicketSection = ({
//     title,
//     tickets,
//     color,
//   }: {
//     title: string
//     tickets: Ticket[]
//     color: "bg-blue-100 text-blue-800" | "bg-yellow-100 text-yellow-800" | "bg-green-100 text-green-800"
//   }) => (
//     <Card>
//       <CardHeader className="pb-3">
//         <div className="flex items-center justify-between">
//           <div>
//             <CardTitle className="flex items-center gap-2">
//               {title}
//               <Badge className={`${color} ml-2`}>{tickets.length}</Badge>
//             </CardTitle>
//             <CardDescription>
//               {tickets.length === 0 ? "Tidak ada tiket" : `${tickets.length} tiket tersedia`}
//             </CardDescription>
//           </div>
//         </div>
//       </CardHeader>
//       <CardContent>
//         {tickets.length === 0 ? (
//           <div className="text-center py-8 text-muted-foreground">
//             <p>Tidak ada tiket dalam kategori ini</p>
//           </div>
//         ) : (
//           <div className="space-y-3">
//             {tickets.map((ticket) => (
//               <AdminTicketDetail
//                 key={ticket.id}
//                 ticket={ticket}
//                 onStatusUpdate={onStatusUpdate}
//                 isUpdating={updatingStatus[ticket.id] || false}
//               />
//             ))}
//           </div>
//         )}
//       </CardContent>
//     </Card>
//   )

//   return (
//     <div className="space-y-6">
//       {/* New Tickets */}
//       <TicketSection title="New Ticket" tickets={newTickets} color="bg-blue-100 text-blue-800" />

//       {/* In Progress Tickets */}
//       <TicketSection title="In Progress Ticket" tickets={inProgressTickets} color="bg-yellow-100 text-yellow-800" />

//       {/* Resolved Tickets */}
//       <TicketSection title="Resolved Ticket" tickets={resolvedTickets} color="bg-green-100 text-green-800" />
//     </div>
//   )
// }
