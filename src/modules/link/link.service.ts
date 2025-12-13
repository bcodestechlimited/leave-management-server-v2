import { ApiSuccess } from "@/utils/responseHandler";
import Link from "./link.model";
import type { IQueryParams } from "@/shared/interfaces/query.interface";
import { paginate } from "@/utils/paginate";

class LinkService {
  async getAllLinks(clientId: string, query: IQueryParams) {
    const { page = 1, limit = 10, search, status } = query;

    const filterQuery: Record<string, any> = { clientId };
    if (search) {
      filterQuery.$or = [{ email: { $regex: search, $options: "i" } }];
    }

    if (status && status.toLowerCase() !== "all") {
      filterQuery.status = status;
    }

    console.log({ filterQuery });

    const { documents: links, pagination } = await paginate({
      model: Link,
      query: filterQuery,
      page,
      limit,
      sort: { createdAt: -1 },
    });

    return ApiSuccess.ok("Links retrieved successfully", { links, pagination });
  }

  async getLink(linkId: string) {
    const link = await Link.findById(linkId).lean().exec();
    return ApiSuccess.ok("Link retrieved successfully", { link });
  }

  async updateLink(linkId: string, linkData: any) {
    const link = await Link.findByIdAndUpdate(linkId, linkData, { new: true });
    return ApiSuccess.ok("Link updated successfully", { link });
  }
}

export const linkService = new LinkService();
