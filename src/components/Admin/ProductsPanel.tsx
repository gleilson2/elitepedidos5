import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { useDeliveryProducts } from '../../hooks/useDeliveryProducts';
import { 
  Package, 
  Plus, 
  Edit3, 
  Trash2, 
  Save, 
  X, 
  Eye, 
  EyeOff, 
  Search,
  AlertCircle,
  CheckCircle,
  Upload,
  Image as ImageIcon
} from 'lucide-react';
import ImageUploadModal from './ImageUploadModal';

interface ProductFormData {
  id: string;
  name: string;
  category: 'acai' | 'combo' | 'milkshake' | 'vitamina' | 'sorvetes' | 'bebidas' | 'complementos' | 'sobremesas' | 'outros';
  price: number;
  original_price?: number;
  description: string;
  image_url?: string;
  is_active: boolean;
  is_weighable: boolean;
  price_per_gram?: number;
  complement_groups?: any;
  sizes?: any;
  scheduled_days?: any;
  availability_type?: string;
}

const ProductsPanel: React.FC = () => {
  const { products, loading, createProduct, updateProduct, deleteProduct, refetch } = useDeliveryProducts();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [editingProduct, setEditingProduct] = useState<ProductFormData | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [lastSaveAttempt, setLastSaveAttempt] = useState<Date | null>(null);

  const categories = [
    { id: 'all', label: 'Todas as Categorias' },
    { id: 'acai', label: 'Açaí' },
    { id: 'combo', label: 'Combos' },
    { id: 'milkshake', label: 'Milkshakes' },
    { id: 'vitamina', label: 'Vitaminas' },
    { id: 'sorvetes', label: 'Sorvetes' },
    { id: 'bebidas', label: 'Bebidas' },
    { id: 'complementos', label: 'Complementos' },
    { id: 'sobremesas', label: 'Sobremesas' },
    { id: 'outros', label: 'Outros' }
  ];

  const filteredProducts = React.useMemo(() => {
    let result = products;
    
    if (searchTerm) {
      result = result.filter(product => 
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (selectedCategory !== 'all') {
      result = result.filter(p => p.category === selectedCategory);
    }
    
    return result;
  }, [products, searchTerm, selectedCategory]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  // Função para validar o formulário
  const validateForm = (formData: ProductFormData): Record<string, string> => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = 'Nome é obrigatório';
    }

    if (!formData.description.trim()) {
      errors.description = 'Descrição é obrigatória';
    }

    if (formData.price <= 0) {
      errors.price = 'Preço deve ser maior que zero';
    }

    if (formData.is_weighable && (!formData.price_per_gram || formData.price_per_gram <= 0)) {
      errors.price_per_gram = 'Preço por grama é obrigatório para produtos pesáveis';
    }

    return errors;
  };

  // Função para criar novo produto
  const handleCreate = () => {
    console.log('🆕 Criando novo produto...');
    setEditingProduct({
      id: '',
      name: '',
      category: 'acai',
      price: 0,
      description: '',
      image_url: '',
      is_active: true,
      is_weighable: false,
      availability_type: 'always'
    });
    setIsCreating(true);
    setFormErrors({});
  };

  // Função para editar produto existente
  const handleEdit = (product: any) => {
    console.log('✏️ Editando produto:', product);
    setEditingProduct({
      id: product.id,
      name: product.name || '',
      category: product.category || 'acai',
      price: product.price || 0,
      original_price: product.original_price,
      description: product.description || '',
      image_url: product.image_url || '',
      is_active: product.is_active !== false,
      is_weighable: product.is_weighable || false,
      price_per_gram: product.price_per_gram,
      complement_groups: product.complement_groups,
      sizes: product.sizes,
      scheduled_days: product.scheduled_days,
      availability_type: product.availability_type || 'always'
    });
    setIsCreating(false);
    setFormErrors({});
  };

  // Função para cancelar edição
  const handleCancel = () => {
    console.log('❌ Cancelando edição...');
    setEditingProduct(null);
    setIsCreating(false);
    setFormErrors({});
  };

  // Função principal de submit do formulário
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); // CRÍTICO: Previne o refresh da página
    
    if (!editingProduct) {
      console.error('❌ Nenhum produto sendo editado');
      return;
    }

    console.log('💾 Iniciando salvamento do produto...', editingProduct);
    setLastSaveAttempt(new Date());

    // Validar formulário
    const errors = validateForm(editingProduct);
    if (Object.keys(errors).length > 0) {
      console.error('❌ Erros de validação:', errors);
      setFormErrors(errors);
      return;
    }

    setSaving(true);
    setFormErrors({});

    try {
      if (isCreating) {
        console.log('🆕 Criando novo produto...');
        const { id, ...productData } = editingProduct;
        await createProduct(productData);
        console.log('✅ Produto criado com sucesso');
      } else {
        console.log('✏️ Atualizando produto existente...', editingProduct.id);
        
        // Verificar se o ID existe
        if (!editingProduct.id) {
          throw new Error('ID do produto não encontrado');
        }

        await updateProduct(editingProduct.id, editingProduct);
        console.log('✅ Produto atualizado com sucesso');
      }

      // Fechar modal e limpar estado
      setEditingProduct(null);
      setIsCreating(false);
      
      // Mostrar feedback de sucesso
      showSuccessMessage(isCreating ? 'Produto criado com sucesso!' : 'Produto atualizado com sucesso!');
      
    } catch (error) {
      console.error('❌ Erro ao salvar produto:', error);
      
      // Mostrar erro específico
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido ao salvar produto';
      setFormErrors({ general: errorMessage });
      
      // Verificar se é erro de autenticação
      if (errorMessage.includes('auth') || errorMessage.includes('permission')) {
        setFormErrors({ 
          general: 'Erro de autenticação. Verifique se você está logado e tem permissão para editar produtos.' 
        });
      }
    } finally {
      setSaving(false);
    }
  };

  // Função para mostrar mensagem de sucesso
  const showSuccessMessage = (message: string) => {
    const successDiv = document.createElement('div');
    successDiv.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 flex items-center gap-2';
    successDiv.innerHTML = `
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
      </svg>
      ${message}
    `;
    document.body.appendChild(successDiv);
    
    setTimeout(() => {
      if (document.body.contains(successDiv)) {
        document.body.removeChild(successDiv);
      }
    }, 3000);
  };

  // Função para deletar produto
  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Tem certeza que deseja excluir "${name}"?`)) {
      try {
        await deleteProduct(id);
        showSuccessMessage('Produto excluído com sucesso!');
      } catch (error) {
        console.error('Erro ao excluir produto:', error);
        alert('Erro ao excluir produto');
      }
    }
  };

  // Função para alternar status ativo/inativo
  const handleToggleActive = async (product: any) => {
    try {
      await updateProduct(product.id, { is_active: !product.is_active });
      showSuccessMessage(`Produto ${!product.is_active ? 'ativado' : 'desativado'} com sucesso!`);
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      alert('Erro ao alterar status do produto');
    }
  };

  // Função para atualizar campo do formulário
  const updateFormField = (field: keyof ProductFormData, value: any) => {
    if (!editingProduct) return;
    
    setEditingProduct(prev => ({
      ...prev!,
      [field]: value
    }));
    
    // Limpar erro do campo quando o usuário começar a digitar
    if (formErrors[field]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        <span className="ml-2 text-gray-600">Carregando produtos...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <Package size={24} className="text-purple-600" />
            Gerenciar Produtos
          </h2>
          <p className="text-gray-600">Configure produtos, preços e disponibilidade</p>
        </div>
        <button
          onClick={handleCreate}
          type="button"
          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
        >
          <Plus size={20} />
          Novo Produto
        </button>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar produtos..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          <div className="lg:w-64">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Products List */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Produto</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Categoria</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Preço</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredProducts.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={product.image_url || 'https://via.placeholder.com/50'}
                        alt={product.name}
                        className="w-12 h-12 object-cover rounded-lg"
                      />
                      <div>
                        <div className="font-medium text-gray-800">{product.name}</div>
                        <div className="text-sm text-gray-500">{product.description}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      {categories.find(c => c.id === product.category)?.label || product.category}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <div className="font-semibold text-green-600">
                      {formatPrice(product.price)}
                    </div>
                    {product.original_price && product.original_price > product.price && (
                      <div className="text-sm text-gray-500 line-through">
                        {formatPrice(product.original_price)}
                      </div>
                    )}
                  </td>
                  <td className="py-4 px-4">
                    <button
                      onClick={() => handleToggleActive(product)}
                      type="button"
                      className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-colors ${
                        product.is_active
                          ? 'bg-green-100 text-green-800 hover:bg-green-200'
                          : 'bg-red-100 text-red-800 hover:bg-red-200'
                      }`}
                    >
                      {product.is_active ? (
                        <>
                          <Eye size={12} />
                          Ativo
                        </>
                      ) : (
                        <>
                          <EyeOff size={12} />
                          Inativo
                        </>
                      )}
                    </button>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(product)}
                        type="button"
                        className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                        title="Editar produto"
                      >
                        <Edit3 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(product.id, product.name)}
                        type="button"
                        className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                        title="Excluir produto"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <Package size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">
              {searchTerm || selectedCategory !== 'all' 
                ? 'Nenhum produto encontrado' 
                : 'Nenhum produto cadastrado'
              }
            </p>
          </div>
        )}
      </div>

      {/* Edit/Create Modal */}
      {editingProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-800">
                  {isCreating ? 'Novo Produto' : 'Editar Produto'}
                </h2>
                <button
                  onClick={handleCancel}
                  type="button"
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* FORMULÁRIO CORRIGIDO */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Erro geral */}
              {formErrors.general && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <AlertCircle size={16} className="text-red-600" />
                    <p className="text-red-600 text-sm">{formErrors.general}</p>
                  </div>
                </div>
              )}

              {/* Debug info */}
              {lastSaveAttempt && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-blue-600 text-sm">
                    Última tentativa de salvamento: {lastSaveAttempt.toLocaleTimeString()}
                  </p>
                  {editingProduct.id && (
                    <p className="text-blue-600 text-xs">ID do produto: {editingProduct.id}</p>
                  )}
                </div>
              )}

              {/* Nome */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome do Produto *
                </label>
                <input
                  type="text"
                  value={editingProduct.name}
                  onChange={(e) => updateFormField('name', e.target.value)}
                  className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                    formErrors.name ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Ex: Açaí Premium 500g"
                  required
                />
                {formErrors.name && (
                  <p className="text-red-600 text-sm mt-1">{formErrors.name}</p>
                )}
              </div>

              {/* Categoria */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Categoria *
                </label>
                <select
                  value={editingProduct.category}
                  onChange={(e) => updateFormField('category', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                >
                  {categories.filter(cat => cat.id !== 'all').map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.label}</option>
                  ))}
                </select>
              </div>

              {/* Preço */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Preço (R$) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={editingProduct.price}
                  onChange={(e) => updateFormField('price', parseFloat(e.target.value) || 0)}
                  className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                    formErrors.price ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="0.00"
                  required
                />
                {formErrors.price && (
                  <p className="text-red-600 text-sm mt-1">{formErrors.price}</p>
                )}
              </div>

              {/* Preço Original (Promoção) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Preço Original (R$) - Opcional
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={editingProduct.original_price || ''}
                  onChange={(e) => updateFormField('original_price', parseFloat(e.target.value) || undefined)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="0.00"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Deixe em branco se não for uma promoção
                </p>
              </div>

              {/* Descrição */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descrição *
                </label>
                <textarea
                  value={editingProduct.description}
                  onChange={(e) => updateFormField('description', e.target.value)}
                  className={`w-full p-3 border rounded-lg resize-none h-20 focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                    formErrors.description ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Descrição do produto..."
                  required
                />
                {formErrors.description && (
                  <p className="text-red-600 text-sm mt-1">{formErrors.description}</p>
                )}
              </div>

              {/* Imagem */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Imagem do Produto
                </label>
                <div className="flex items-center gap-4">
                  <img
                    src={editingProduct.image_url || 'https://via.placeholder.com/100'}
                    alt="Preview"
                    className="w-20 h-20 object-cover rounded-lg border border-gray-300"
                  />
                  <button
                    onClick={() => setShowImageUpload(true)}
                    type="button"
                    className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    <ImageIcon size={16} />
                    Alterar Imagem
                  </button>
                </div>
              </div>

              {/* Produto Pesável */}
              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editingProduct.is_weighable}
                    onChange={(e) => updateFormField('is_weighable', e.target.checked)}
                    className="w-4 h-4 text-purple-600"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Produto pesável (vendido por peso)
                  </span>
                </label>
              </div>

              {/* Preço por grama (se pesável) */}
              {editingProduct.is_weighable && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Preço por grama (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    min="0"
                    value={editingProduct.price_per_gram || ''}
                    onChange={(e) => updateFormField('price_per_gram', parseFloat(e.target.value) || undefined)}
                    className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                      formErrors.price_per_gram ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="0.0000"
                    required
                  />
                  {formErrors.price_per_gram && (
                    <p className="text-red-600 text-sm mt-1">{formErrors.price_per_gram}</p>
                  )}
                  {editingProduct.price_per_gram && (
                    <p className="text-xs text-gray-500 mt-1">
                      Preço por kg: {formatPrice((editingProduct.price_per_gram || 0) * 1000)}
                    </p>
                  )}
                </div>
              )}

              {/* Status Ativo */}
              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editingProduct.is_active}
                    onChange={(e) => updateFormField('is_active', e.target.checked)}
                    className="w-4 h-4 text-purple-600"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Produto ativo (visível no cardápio)
                  </span>
                </label>
              </div>

              {/* Botões do formulário */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={handleCancel}
                  type="button"
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white rounded-lg transition-colors flex items-center gap-2"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      {isCreating ? 'Criar Produto' : 'Salvar Alterações'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Image Upload Modal */}
      {showImageUpload && (
        <ImageUploadModal
          isOpen={showImageUpload}
          onClose={() => setShowImageUpload(false)}
          onSelectImage={(imageUrl) => {
            updateFormField('image_url', imageUrl);
            setShowImageUpload(false);
          }}
          currentImage={editingProduct?.image_url}
        />
      )}
    </div>
  );
};

export default ProductsPanel;