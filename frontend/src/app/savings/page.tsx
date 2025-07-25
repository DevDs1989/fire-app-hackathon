'use client';

import { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import axios from 'axios';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { toast } from 'sonner';

interface SavingEntry {
  id?: number;
  name: string;
  amount: string;
  created_at?: string;
  formatted?: string;
}

axios.defaults.baseURL = 'http://localhost:8080/api';

export default function SavingsPage() {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [savedEntries, setSavedEntries] = useState<SavingEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchSavedEntries = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/savings');
      setSavedEntries(response.data.entries ?? []);
    } catch (e: any) {
      toast.error(e?.response?.data?.error || e?.message || 'Failed to fetch');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSavedEntries();
  }, []);

  const handleAddEntry = async () => {
    if (!name.trim() || !amount.trim()) return;

    setLoading(true);
    try {
      const response = await axios.post('/savings', {
        savings: [{ name, amount }],
      });
      setSavedEntries(response.data.entries ?? []);
      toast.success('Entry saved successfully');
      setName('');
      setAmount('');
    } catch (e: any) {
      toast.error(e?.response?.data?.error || e?.message || 'Failed to save');
    }
    setLoading(false);
  };

  const handleDelete = async (id?: number) => {
    if (!id) return;
    setLoading(true);
    try {
      await axios.delete(`/savings/${id}`);
      await fetchSavedEntries();
      toast.success('Entry deleted');
    } catch (e: any) {
      toast.error(e?.response?.data?.error || e?.message || 'Failed to delete');
    }
    setLoading(false);
  };

  return (
    <div className="p-4 max-w-lg mx-auto">
      <h1 className="mb-4 text-xl font-bold">Log Your Savings</h1>

      <div className="flex gap-2 mb-4">
        <Input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name"
        />
        <Input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Amount in ₹"
        />
        <Button onClick={handleAddEntry} disabled={loading}>
          {loading ? 'Saving...' : 'Add'}
        </Button>
      </div>

      <div className="mt-8">
        <h2 className="font-semibold mb-2">All Saved Entries</h2>
        <Button onClick={fetchSavedEntries} disabled={loading} className="mb-2">
          Refresh
        </Button>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Amount (₹)</TableHead>
              <TableHead>Saved At</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {savedEntries.map((entry) => (
              <TableRow key={entry.id}>
                <TableCell>{entry.name}</TableCell>
                <TableCell>{entry.formatted ?? entry.amount}</TableCell>
                <TableCell>
                  {entry.created_at
                    ? new Date(entry.created_at).toLocaleString('en-IN', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                        hour12: true,
                      })
                    : ''}
                </TableCell>
                <TableCell>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(entry.id)}
                    disabled={loading}
                  >
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
