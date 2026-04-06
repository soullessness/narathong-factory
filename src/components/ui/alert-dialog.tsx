'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

// AlertDialog wraps Dialog for confirm patterns
function AlertDialog({
  open,
  onOpenChange,
  children,
}: {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children?: React.ReactNode
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {children}
    </Dialog>
  )
}

function AlertDialogContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof DialogContent>) {
  return (
    <DialogContent showCloseButton={false} className={cn(className)} {...props}>
      {children}
    </DialogContent>
  )
}

function AlertDialogHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return <DialogHeader className={className} {...props} />
}

function AlertDialogFooter({ className, ...props }: React.ComponentProps<typeof DialogFooter>) {
  return <DialogFooter className={className} {...props} />
}

function AlertDialogTitle({ className, ...props }: React.ComponentProps<typeof DialogTitle>) {
  return <DialogTitle className={className} {...props} />
}

function AlertDialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogDescription>) {
  return <DialogDescription className={className} {...props} />
}

function AlertDialogAction({
  className,
  onClick,
  disabled,
  children,
  ...props
}: React.ComponentProps<typeof Button>) {
  return (
    <Button className={cn(className)} onClick={onClick} disabled={disabled} {...props}>
      {children}
    </Button>
  )
}

function AlertDialogCancel({
  className,
  onClick,
  disabled,
  children,
  ...props
}: React.ComponentProps<typeof Button>) {
  return (
    <Button variant="outline" className={cn(className)} onClick={onClick} disabled={disabled} {...props}>
      {children || 'ยกเลิก'}
    </Button>
  )
}

export {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
}
