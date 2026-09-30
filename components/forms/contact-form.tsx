'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Send } from 'lucide-react';
import { contactSchema, type ContactInput } from '@/lib/validations/contact';
import { submitContactMessage } from '@/actions/contact';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label, FieldError } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

export function ContactForm() {
  const [isPending, startTransition] = React.useTransition();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContactInput>({ resolver: zodResolver(contactSchema), defaultValues: { website: '' } });

  function onSubmit(data: ContactInput) {
    startTransition(async () => {
      const result = await submitContactMessage(data);
      if (result.success) {
        toast.success(result.message);
        reset();
      } else {
        toast.error(result.message);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <input type="text" {...register('website')} className="hidden" tabIndex={-1} autoComplete="off" />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="name">Nom</Label>
          <Input id="name" {...register('name')} />
          <FieldError message={errors.name?.message} />
        </div>
        <div>
          <Label htmlFor="email">E-mail</Label>
          <Input id="email" type="email" {...register('email')} />
          <FieldError message={errors.email?.message} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="phone">Téléphone (facultatif)</Label>
          <Input id="phone" type="tel" placeholder="+31 6 12 34 56 78" {...register('phone')} />
          <FieldError message={errors.phone?.message} />
        </div>
        <div>
          <Label htmlFor="subject">Sujet</Label>
          <Input id="subject" {...register('subject')} />
          <FieldError message={errors.subject?.message} />
        </div>
      </div>

      <div>
        <Label htmlFor="message">Message</Label>
        <Textarea id="message" rows={5} {...register('message')} />
        <FieldError message={errors.message?.message} />
      </div>

      <Button type="submit" isLoading={isPending} size="lg" className="w-full sm:w-auto">
        <Send className="h-4 w-4" />
        Envoyer le message
      </Button>
    </form>
  );
}
