import { Injectable } from '@nestjs/common';
import { IFile, IUser } from 'src/common/interfaces';
import { CloudinaryService } from 'src/common/service';
import { HydratedUserDocument } from 'src/model';

@Injectable()
export class UserService {
  constructor(private readonly cloudinaryService: CloudinaryService) {}

  profile() {
    return { id: 25, username: 'abo al magd', age: 25 };
  }

  async profileImage(file: IFile, user: HydratedUserDocument): Promise<IUser> {
    const oldImage = user.profilePicture;

    const { Key } = await this.cloudinaryService.uploadAsset({
      file,
      path: `Users/${user._id.toString()}`,
    });
    user.profilePicture = Key;

    await user.save();

    if (oldImage) {
      await this.cloudinaryService.deleteAsset({ key: oldImage });
    }

    return user.toJSON();
  }
}
