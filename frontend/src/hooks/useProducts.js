import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createProduct,
  deleteProduct,
  getAllProducts,
  getMyProducts,
  getProductById,
} from "../lib/api";

export const useProducts = () => {
  const result = useQuery({ queryKey: ["products"], queryFn: getAllProducts });
  return result;
};

export const useCreateProduct = () => {
  return useMutation({ mutationFn: createProduct });
};

export const useProduct = (id) => {
  return useQuery({
    queryKey: ["product", id],
    queryFn: () => getProductById(id),
    enabled: !!id, // converting the string to boolean this is called double bang operator in javascript
  });
};

export const useDeleteProduct = () => {
  const queryclient = useQueryClient();

  return useMutation({
    mutationFn: deleteProduct,

    onSuccess: () => {
      queryclient.invalidateQueries({ queryKey: ["myProducts"] });
    },
  });
};

export const useMyProducts = () => {
  return useQuery({
    queryKey: ["myProducts"],
    queryFn: getMyProducts,
  });
};
