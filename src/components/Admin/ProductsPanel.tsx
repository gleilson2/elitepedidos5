import React, { useState } from 'react';
import { Plus, Package, Edit, Trash2, Save, X } from 'lucide-react';
import { useDeliveryProducts, type DeliveryProduct } from '../../hooks/useDeliveryProducts';

const ProductsPanel: React.FC = () => {
  const { products, loading, error, createProduct, updateProduct, deleteProduct } = useDeliveryProducts();
  const [isCreating, setIsCreating] = useState(false);
  const [editingProduct, setEditingProduct] = useState<DeliveryProduct | null>(null);
  const [formData, setFormData] = useState<Partial<DeliveryProduct>>({});

  const handleCreateProduct = async (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      await createProduct({
        name: formData.name || '',
        category: formData.category || 'outros',
        price: formData.price || 0,
        description: formData.description || '',
        is_active: formData.is_active ?? true,
        is_weighable: formData.is_weighable || false,
        image_url: formData.image_url,
        original_price: formData.original_price,
        price_per_gram: formData.price_per_gram,
        complement_groups: formData.complement_groups,
        sizes: formData.sizes,
        scheduled_days: formData.scheduled_days,
        availability_type: formData.availability_type || 'always'
      });
      setIsCreating(false);
      setFormData({});
    } catch (err) {
      console.error('Erro ao criar produto:', err);
      alert('Erro ao criar produto: ' + (err instanceof Error ? err.message : 'Erro desconhecido'));
    }
  };

  const handleUpdateProduct = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    
    try {
      await updateProduct(editingProduct.id, formData);
      setEditingProduct(null);
      setFormData({});
    } catch (err) {
      console.error('Erro ao atualizar produto:', err);
      alert('Erro ao atualizar produto: ' + (err instanceof Error ? err.message : 'Erro desconhecido'));
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este produto?')) return;
    
    try {
      await deleteProduct(id);
    } catch (err) {
      console.error('Erro ao excluir produto:', err);
      alert('Erro ao excluir produto: ' + (err instanceof Error ? err.message : 'Erro desconhecido'));
    }
  };

  const startEdit = (product: DeliveryProduct) => {
    setEditingProduct(product);
    setFormData(product);
  };

  const cancelEdit = () => {
    setEditingProduct(null);
    setFormData({});
    setIsCreating(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Carregando produtos...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Erro: {error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Package className="w-6 h-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900">Produtos</h2>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Produto</span>
        </button>
      </div>

      {/* Form for creating/editing */}
      {(isCreating || editingProduct) && (
        <div className="bg-white p-6 rounded-lg border border-gray-200 space-y-4">
          <h3 className="text-lg font-semibold">
            {isCreating ? 'Criar Novo Produto' : 'Editar Produto'}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
              <input
                type="text"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Nome do produto"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
              <select
                value={formData.category || 'outros'}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as DeliveryProduct['category'] })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="acai">Açaí</option>
                <option value="combo">Combo</option>
                <option value="milkshake">Milkshake</option>
                <option value="vitamina">Vitamina</option>
                <option value="sorvetes">Sorvetes</option>
                <option value="bebidas">Bebidas</option>
                <option value="complementos">Complementos</option>
                <option value="sobremesas">Sobremesas</option>
                <option value="outros">Outros</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Preço (R$)</label>
              <input
                type="number"
                step="0.01"
                value={formData.price || ''}
                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">URL da Imagem</label>
              <input
                type="url"
                value={formData.image_url || ''}
                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://..."
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
              <textarea
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Descrição do produto"
              />
            </div>

            <div className="flex items-center space-x-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.is_active ?? true}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="mr-2"
                />
                Ativo
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.is_weighable || false}
                  onChange={(e) => setFormData({ ...formData, is_weighable: e.target.checked })}
                  className="mr-2"
                />
                Pesável
              </label>
            </div>
          </div>

          <div className="flex space-x-2">
            <button
              type="button"
              onClick={isCreating ? handleCreateProduct : handleUpdateProduct}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>Salvar</span>
            </button>
            <button
              type="button"
              onClick={cancelEdit}
              className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 flex items-center space-x-2"
            >
              <X className="w-4 h-4" />
              <span>Cancelar</span>
            </button>
          </div>
        </div>
      )}

      {/* Products list */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Produto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Categoria
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Preço
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {product.image_url && (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="h-10 w-10 rounded-full object-cover mr-3"
                        />
                      )}
                      <div>
                        <div className="text-sm font-medium text-gray-900">{product.name}</div>
                        <div className="text-sm text-gray-500">{product.description}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                      {product.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    R$ {product.price.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      product.is_active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {product.is_active ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => startEdit(product)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(product.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {products.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          Nenhum produto encontrado. Clique em "Novo Produto" para adicionar o primeiro.
        </div>
      )}
    </div>
  );
};

export default ProductsPanel;