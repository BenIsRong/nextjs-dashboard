'use server';

import { sql } from '@vercel/postgres';
import {z} from 'zod';
import {revalidatePath} from 'next/cache';
import { redirect } from 'next/navigation';

const formSchema = z.object({
    id: z.string(),
    customerId: z.string(),
    amount: z.coerce.number(),
    status: z.enum(['pending', 'paid']),
    date: z.string(),
});

const CreateInvoice = formSchema.omit({id: true, date: true});
const UpdateInvoice = formSchema.omit({id: true, date: true});

export async function createInvoice(formData: FormData){
    const {customerId, amount, status} = CreateInvoice.parse({
        customerId: formData.get('customerId'),
        amount: formData.get('amount'),
        status: formData.get('status'),
    });

    const amountInCents = amount * 100;
    const date = new Date().toISOString().split("T")[0];

    try{
        await sql`INSERT INTO invoices (customer_id, amount, status, date) VALUES (${customerId}, ${amount}, ${status}, ${date})`;
    }catch(error){
        return {message: "An error occured when creating an invoice."};
    }

    revalidatePath('/dashboard/invoices');
    redirect('/dashboard/invoices');

}

export async function updateInvoice(id: string, formData: FormData){
    const {customerId, amount, status} = UpdateInvoice.parse({
        customerId: formData.get('customerId'),
        amount: formData.get('amount'),
        status: formData.get('status'),
    });

    const amountInCents = amount * 100;

    try{
        await sql`UPDATE invoices SET customer_id = ${customerId}, amount = ${amount}, status = ${status} WHERE id = ${id}`;
    }catch(error){
        return {message: "An error occured with editing this invoice."};
    }

    revalidatePath('/dashboard/invoices');
    redirect('/dashboard/invoices');
}

export async function deleteInvoice(id: string){

    try{    
        await sql`DELETE FROM invoices WHERE id=${id}`;
        revalidatePath('/dashboard/invoices');
        return {message: "Deleted invoice."};
    }catch(error){
        return {message: "An error occured with deleting this invoice."};
    }

}