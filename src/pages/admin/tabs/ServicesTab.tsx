import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Scissors, 
  Plus, 
  Trash2, 
  Edit2, 
  Clock, 
  DollarSign, 
  Check, 
  X,
  LayoutGrid,
  List,
  Eye,
  EyeOff,
  Link as LinkIcon,
  Copy
} from 'lucide-react';
import { Service } from '../../../services/api';
import toast from 'react-hot-toast';

interface ServicesTabProps {
  services: Service[];
  onAddService: (service: Omit<Service, 'id'>) => Promise<any>;
  onUpdateService: (id: string, service: Partial<Service>) => Promise<any>;
  onDeleteService: (id: string) => Promise<any>;
  onMigrate: () => Promise<any>;
}

const ServicesTab: React.FC<ServicesTabProps> = ({
  services,
  onAddService,
  onUpdateService,
  onDeleteService,
  onMigrate
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // Form State
  const [formData, setFormData] = useState<Omit<Service, 'id'>>({
    name: '',
    desc: '',
    price: '',
    duration: 30,
    isHidden: false
  });

  const resetForm = () => {
    setFormData({ name: '', desc: '', price: '', duration: 30, isHidden: false });
    setIsAdding(false);
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await onUpdateService(editingId, formData);
        toast.success("Service updated successfully");
      } else {
        await onAddService(formData);
        toast.success("Service added successfully");
      }
      resetForm();
    } catch (error) {
      toast.error("Failed to save service");
    }
  };

  const startEdit = (service: Service) => {
    setFormData({
      name: service.name,
      desc: service.desc,
      price: service.price,
      duration: service.duration,
      isHidden: service.isHidden || false
    });
    setEditingId(service.id);
    setIsAdding(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this service? This cannot be undone.")) {
      try {
        await onDeleteService(id);
        toast.success("Service deleted");
      } catch (error) {
        toast.error("Failed to delete service");
      }
    }
  };

  const handleCopyLink = (serviceId: string) => {
    const link = `${window.location.origin}/book?serviceId=${serviceId}`;
    navigator.clipboard.writeText(link);
    toast.success("Direct booking link copied!");
  };

  const handleMigrate = async () => {
    const res = await onMigrate();
    if (res.success) {
      toast.success(res.message);
    } else {
      toast.error(res.message);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-8"
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="font-headline text-3xl font-bold uppercase tracking-tight text-primary">Service Menu</h2>
          <p className="text-on-surface-variant text-sm mt-1">Manage what your clients can book online.</p>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex bg-surface-container-highest p-1 border border-outline-variant/10">
            <button 
              onClick={() => setViewMode('grid')}
              className={`p-2 transition-all ${viewMode === 'grid' ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:text-on-surface'}`}
            >
              <LayoutGrid size={18} />
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={`p-2 transition-all ${viewMode === 'list' ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:text-on-surface'}`}
            >
              <List size={18} />
            </button>
          </div>
          
          <button 
            onClick={() => { resetForm(); setIsAdding(true); }}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 gold-gradient text-on-primary font-headline uppercase text-[10px] font-bold tracking-[0.2em] shadow-xl hover:brightness-110 active:scale-95 transition-all"
          >
            <Plus size={16} /> Add New Service
          </button>
        </div>
      </div>

      {services.length === 0 && !isAdding && (
         <div className="bg-surface-container p-12 text-center border-2 border-dashed border-outline-variant/10 flex flex-col items-center gap-6">
            <div className="w-16 h-16 bg-primary/10 border border-primary/20 rounded-full flex items-center justify-center text-primary">
              <Scissors size={32} />
            </div>
            <div className="max-w-md">
              <h3 className="font-headline text-xl font-bold uppercase tracking-tight mb-2">No Services Configured</h3>
              <p className="text-on-surface-variant text-sm mb-6">It looks like your service menu is empty. You can migrate your existing hardcoded services to Firestore with one click.</p>
              <button 
                onClick={handleMigrate}
                className="px-8 py-3 border border-primary text-primary hover:bg-primary hover:text-on-primary transition-all font-headline uppercase text-[10px] font-bold tracking-widest"
              >
                Migrate Existing Services
              </button>
            </div>
         </div>
      )}

      {/* Add/Edit Form Overlay */}
      <AnimatePresence>
        {isAdding && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-surface-container-highest/80 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-surface-container p-8 border border-outline-variant/20 shadow-2xl max-w-2xl w-full"
            >
              <div className="flex justify-between items-center mb-8">
                <h3 className="font-headline text-2xl font-bold uppercase tracking-tight">
                  {editingId ? 'Edit Service' : 'New Service'}
                </h3>
                <button onClick={resetForm} className="p-2 hover:bg-surface-container-highest transition-colors rounded-full text-on-surface-variant">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold tracking-widest text-outline">Service Name</label>
                  <input 
                    required
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="e.g. Classic Haircut"
                    className="w-full bg-surface-container-lowest border border-outline-variant/30 text-on-surface p-4 focus:border-primary focus:outline-none transition-colors"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold tracking-widest text-outline">Description</label>
                  <textarea 
                    required
                    value={formData.desc}
                    onChange={(e) => setFormData({...formData, desc: e.target.value})}
                    placeholder="Describe what's included in the service..."
                    rows={3}
                    className="w-full bg-surface-container-lowest border border-outline-variant/30 text-on-surface p-4 focus:border-primary focus:outline-none transition-colors resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-bold tracking-widest text-outline">Price Label</label>
                    <div className="relative">
                      <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-primary" size={18} />
                      <input 
                        required
                        type="text"
                        value={formData.price}
                        onChange={(e) => setFormData({...formData, price: e.target.value})}
                        placeholder="e.g. 35+"
                        className="w-full bg-surface-container-lowest border border-outline-variant/30 text-on-surface p-4 pl-12 focus:border-primary focus:outline-none transition-colors"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-bold tracking-widest text-outline">Duration (mins)</label>
                    <div className="relative">
                      <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-primary" size={18} />
                      <input 
                        required
                        type="number"
                        value={formData.duration}
                        onChange={(e) => setFormData({...formData, duration: parseInt(e.target.value)})}
                        className="w-full bg-surface-container-lowest border border-outline-variant/30 text-on-surface p-4 pl-12 focus:border-primary focus:outline-none transition-colors"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 bg-surface-container-low p-4 border border-outline-variant/10">
                  <button
                    type="button"
                    onClick={() => setFormData({...formData, isHidden: !formData.isHidden})}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${formData.isHidden ? 'bg-outline' : 'bg-primary'}`}
                  >
                    <span
                      className={`${
                        formData.isHidden ? 'translate-x-1' : 'translate-x-6'
                      } inline-block h-4 w-4 transform rounded-full bg-on-primary transition-transform`}
                    />
                  </button>
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase font-bold tracking-widest text-on-surface">Public Visibility</span>
                    <span className="text-xs text-on-surface-variant">
                      {formData.isHidden ? 'Hidden from public ritual menu' : 'Visible to everyone'}
                    </span>
                  </div>
                </div>

                <div className="flex justify-end gap-4 pt-6">
                  <button 
                    type="button" 
                    onClick={resetForm}
                    className="px-8 py-4 border border-outline-variant/20 text-on-surface-variant font-headline uppercase text-[10px] font-bold tracking-widest hover:border-outline-variant/50 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="px-12 py-4 gold-gradient text-on-primary font-headline uppercase text-[10px] font-bold tracking-widest shadow-xl flex items-center justify-center gap-2"
                  >
                    <Check size={16} /> {editingId ? 'Update Service' : 'Create Service'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Services Display */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {services.map((service) => (
            <motion.div 
              layout
              key={service.id}
              className="bg-surface-container border border-outline-variant/10 p-6 flex flex-col group relative overflow-hidden"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="bg-primary/5 p-3 border border-primary/20 text-primary">
                  <Scissors size={24} />
                </div>
                <div className="flex gap-1 items-center">
                  {service.isHidden && (
                    <span className="bg-outline/20 text-on-surface-variant px-2 py-0.5 text-[8px] uppercase font-bold tracking-widest border border-outline/20 mr-2 flex items-center gap-1">
                      <EyeOff size={10} /> Hidden
                    </span>
                  )}
                  <button 
                    onClick={() => handleCopyLink(service.id)} 
                    className="p-2 text-on-surface-variant hover:text-primary transition-colors"
                    title="Copy Direct Link"
                  >
                    <LinkIcon size={18} />
                  </button>
                  <button onClick={() => startEdit(service)} className="p-2 text-on-surface-variant hover:text-primary transition-colors">
                    <Edit2 size={18} />
                  </button>
                  <button onClick={() => handleDelete(service.id)} className="p-2 text-on-surface-variant hover:text-red-500 transition-colors">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              <h3 className="font-headline font-bold text-xl uppercase tracking-tight mb-2">{service.name}</h3>
              <p className="text-on-surface-variant text-sm flex-1 leading-relaxed">{service.desc}</p>
              
              <div className="mt-6 pt-6 border-t border-outline-variant/20 flex justify-between items-center">
                <div className="flex items-center gap-2 text-primary">
                  <DollarSign size={18} strokeWidth={3} />
                  <span className="font-headline font-bold text-2xl">{service.price}</span>
                </div>
                <div className="flex items-center gap-2 text-on-surface-variant">
                  <Clock size={16} />
                  <span className="font-headline uppercase text-[10px] font-bold tracking-widest">{service.duration} mins</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="bg-surface-container border border-outline-variant/10 overflow-hidden">
           <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-highest border-b border-outline-variant/20">
                  <th className="p-6 font-headline uppercase text-[10px] tracking-widest">Service</th>
                   <th className="p-6 font-headline uppercase text-[10px] tracking-widest">Price</th>
                  <th className="p-6 font-headline uppercase text-[10px] tracking-widest text-center">Duration</th>
                  <th className="p-6 font-headline uppercase text-[10px] tracking-widest text-center">Status</th>
                  <th className="p-6 font-headline uppercase text-[10px] tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10">
                {services.map((service) => (
                  <tr key={service.id} className="hover:bg-surface-container-highest/50 transition-colors">
                    <td className="p-6 max-w-md">
                      <div className="font-headline font-bold uppercase">{service.name}</div>
                      <div className="font-body text-xs text-on-surface-variant truncate">{service.desc}</div>
                    </td>
                    <td className="p-6">
                      <div className="font-headline font-bold text-lg text-primary">${service.price}</div>
                    </td>
                     <td className="p-6 text-center">
                      <div className="font-headline text-[10px] uppercase font-bold tracking-widest">{service.duration} mins</div>
                    </td>
                    <td className="p-6 text-center">
                      {service.isHidden ? (
                        <span className="inline-flex items-center gap-1 bg-outline/10 text-on-surface-variant px-2 py-0.5 text-[8px] uppercase font-bold tracking-widest border border-outline/20">
                          <EyeOff size={10} /> Hidden
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-primary/10 text-primary px-2 py-0.5 text-[8px] uppercase font-bold tracking-widest border border-primary/20">
                          <Eye size={10} /> Public
                        </span>
                      )}
                    </td>
                    <td className="p-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handleCopyLink(service.id)} 
                          className="p-2 text-on-surface-variant hover:text-primary transition-colors"
                          title="Copy Direct Link"
                        >
                          <LinkIcon size={18} />
                        </button>
                        <button onClick={() => startEdit(service)} className="p-2 text-on-surface-variant hover:text-primary transition-colors">
                          <Edit2 size={18} />
                        </button>
                        <button onClick={() => handleDelete(service.id)} className="p-2 text-on-surface-variant hover:text-red-500 transition-colors">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
           </table>
        </div>
      )}
    </motion.div>
  );
};

export default ServicesTab;
