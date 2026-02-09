'use client'; // Obligatoire pour utiliser useState
import React, { useState } from 'react';

const MetricCard = ({ label, value, subValue, color }: { label: string, value: string, subValue?: string, color: string }) => (
  <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
    <p className="text-gray-500 text-sm font-medium uppercase tracking-wider">{label}</p>
    <div className="mt-2">
      <h3 className="text-3xl font-bold text-gray-800">{value}</h3>
      {subValue && <p className={`text-sm font-bold mt-1 ${color}`}>{subValue}</p>}
    </div>
  </div>
);

export default function VigilanDashboard() {
  const [isAiOpen, setIsAiOpen] = useState(false); // État pour le slide de l'IA

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#212529] relative overflow-x-hidden">
      
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200 px-8 py-4 flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <span className="text-2xl font-bold tracking-tighter text-slate-800">🛡️ VIGILAN</span>
        </div>
        <button 
          onClick={() => setIsAiOpen(true)}
          className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-slate-800 transition shadow-md"
        >
          🤖 Demander à l'IA
        </button>
      </nav>

      <main className="p-8 max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold mb-8">Résultats de la recherche </h1>

        {/* Métriques */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <MetricCard label="Total Logs" value="121 232" color="text-gray-400" />
          <MetricCard label="Logs Normaux" value="79 785" subValue="65.8%" color="text-orange-500" />
          <MetricCard label="Attaques" value="41 447" subValue="34.2%" color="text-red-500" />
        </div>

        {/* Tableau de Logs */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h2 className="font-bold text-lg">Analyse du Log de Sécurité Firewall </h2>
          </div>
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-400 text-xs uppercase font-bold">
              <tr>
                <th className="px-6 py-4">Timestamp </th>
                <th className="px-6 py-4">IP Source </th>
                <th className="px-6 py-4">Protocole </th>
                <th className="px-6 py-4">Statut </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              <tr className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm">2025-12-10 10:45:12 </td>
                <td className="px-6 py-4 text-sm font-mono font-bold">192.168.1.42</td>
                <td className="px-6 py-4 text-sm font-bold text-blue-600">TCP </td>
                <td className="px-6 py-4">
                  <span className="bg-red-100 text-red-600 px-2 py-1 rounded text-[10px] font-black uppercase">Attaque</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </main>

      {/* --- SIDEBAR IA COULISSANTE (FP4) --- */}
      {/* Overlay sombre quand l'IA est ouverte */}
      {isAiOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity"
          onClick={() => setIsAiOpen(false)}
        />
      )}

      {/* Panneau latéral */}
      <aside className={`fixed right-0 top-0 h-full w-96 bg-slate-900 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${isAiOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-6 h-full flex flex-col">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span>🤖</span> Agent LLM
            </h2>
            <button onClick={() => setIsAiOpen(false)} className="text-slate-400 hover:text-white text-2xl">&times;</button>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto">
            <div className="bg-slate-800 p-4 rounded-lg border-l-4 border-blue-500">
              <p className="text-blue-400 text-xs font-bold uppercase mb-1">Analyse RAG - Attaque Détectée</p>
              <p className="text-gray-300 text-sm">
                L'anomalie détectée est une tentative d'injection de script intersite (XSS). 
                L'action effectuée par le pare-feu est de refuser la connexion.
              </p>
            </div>
            
            <div className="bg-slate-800 p-4 rounded-lg">
              <p className="text-gray-400 text-xs font-bold uppercase mb-1">Recommandation</p>
              <p className="text-gray-300 text-sm">Vérifiez l'intégrité du serveur à l'adresse 192.168.1.42 et mettez à jour les filtres de sécurité.</p>
            </div>
          </div>

          <div className="mt-auto pt-6">
            <input 
              type="text" 
              placeholder="Posez une question à l'IA..." 
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </aside>
    </div>
  );
}
