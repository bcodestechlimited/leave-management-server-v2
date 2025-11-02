import { ApiSuccess } from "@/utils/responseHandler";
import Link from "./link.model";
import type { IQueryParams } from "@/shared/interfaces/query.interface";
import { paginate } from "@/utils/paginate";

class LinkService {
  async getAllLinks(clientId: string, query: IQueryParams) {
    const { page = 1, limit = 10 } = query;

    const { documents: links, pagination } = await paginate({
      model: Link,
      query: { clientId },
      page,
      limit,
      sort: { createdAt: -1 },
    });

    return ApiSuccess.ok("Links retrieved successfully", { links, pagination });
  }
}

export const linkService = new LinkService();
